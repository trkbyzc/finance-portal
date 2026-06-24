package com.financeportal.service.chat.llm;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.financeportal.model.enums.ChatRole;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;

/**
 * Google Gemini LLM provider.
 * Endpoint: POST {base-url}/models/{model}:generateContent
 *
 * Auth: API key formatı 2 farklı şekilde olabiliyor:
 *   - AIza... (klasik) → query param: ?key=
 *   - AQ.Ab8... (yeni / OAuth ephemeral) → Authorization: Bearer
 * Hangisi olduğunu key prefix'inden anlıyoruz.
 */
@Component
@Slf4j
public class GeminiClient implements LlmClient {

    private static final String NAME = "gemini";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final String baseUrl;
    private final String model;
    private final String apiKey;

    public GeminiClient(@Qualifier("llmRestTemplate") RestTemplate restTemplate,
                        ObjectMapper objectMapper,
                        @Value("${app.llm.gemini.base-url}") String baseUrl,
                        @Value("${app.llm.gemini.model}") String model,
                        @Value("${app.llm.gemini.api-key:}") String apiKey) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        this.baseUrl = baseUrl;
        this.model = model;
        this.apiKey = apiKey;
    }

    @Override public String name() { return NAME; }

    @Override
    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    @Override
    public LlmResponse generate(LlmRequest request) {
        if (!isConfigured()) {
            throw new LlmException("Gemini API key konfigüre edilmemiş", true, 0);
        }
        try {
            ObjectNode body = buildRequestBody(request);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // Google AI Studio her iki format (AIza... ve yeni AQ.Ab8...) için de query param
            // ile çalışıyor. Bearer header denedik ama generativelanguage.googleapis.com
            // 401 dönüyor — sadece ?key= kabul ediyor.
            String url = baseUrl + "/models/" + model + ":generateContent?key=" + apiKey;

            HttpEntity<String> entity = new HttpEntity<>(body.toString(), headers);
            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.POST, entity, String.class);
            return parseResponse(response.getBody());
        } catch (HttpClientErrorException e) {
            int status = e.getStatusCode().value();
            boolean retriable = status == 429 || status == 408 || status == 425;
            log.warn("[LLM/gemini] HTTP {} — {}", status, e.getResponseBodyAsString());
            throw new LlmException("Gemini " + status + ": " + e.getMessage(), e, retriable, status);
        } catch (HttpServerErrorException e) {
            log.warn("[LLM/gemini] 5xx — {}", e.getMessage());
            throw new LlmException("Gemini 5xx: " + e.getMessage(), e, true, e.getStatusCode().value());
        } catch (ResourceAccessException e) {
            log.warn("[LLM/gemini] timeout/IO — {}", e.getMessage());
            throw new LlmException("Gemini network: " + e.getMessage(), e, true, 0);
        } catch (Exception e) {
            log.error("[LLM/gemini] beklenmeyen hata", e);
            throw new LlmException("Gemini beklenmeyen: " + e.getMessage(), e, true, 0);
        }
    }

    private ObjectNode buildRequestBody(LlmRequest req) {
        ObjectNode root = objectMapper.createObjectNode();

        // System mesajlarını ayrı systemInstruction'a topla
        StringBuilder systemText = new StringBuilder();
        List<LlmMessage> chatMessages = new ArrayList<>();
        if (req.getMessages() != null) {
            for (LlmMessage m : req.getMessages()) {
                if (m.getRole() == ChatRole.SYSTEM) {
                    if (systemText.length() > 0) systemText.append("\n\n");
                    systemText.append(m.getContent() != null ? m.getContent() : "");
                } else {
                    chatMessages.add(m);
                }
            }
        }
        if (systemText.length() > 0) {
            ObjectNode sys = root.putObject("systemInstruction");
            sys.putArray("parts").addObject().put("text", systemText.toString());
        }

        ArrayNode contents = root.putArray("contents");
        for (LlmMessage m : chatMessages) {
            ObjectNode c = contents.addObject();
            c.put("role", roleToString(m.getRole()));
            ArrayNode parts = c.putArray("parts");
            if (m.getRole() == ChatRole.TOOL) {
                // Tool sonucu → functionResponse
                ObjectNode fr = parts.addObject().putObject("functionResponse");
                fr.put("name", m.getToolName() != null ? m.getToolName() : "tool");
                ObjectNode resp = fr.putObject("response");
                // Gemini "response" alanı object bekler — content'i wrap'le
                resp.put("content", m.getContent() != null ? m.getContent() : "");
            } else if (m.getRole() == ChatRole.ASSISTANT && m.getToolCalls() != null && !m.getToolCalls().isEmpty()) {
                if (m.getContent() != null && !m.getContent().isBlank()) {
                    parts.addObject().put("text", m.getContent());
                }
                for (LlmToolCall tc : m.getToolCalls()) {
                    ObjectNode fc = parts.addObject().putObject("functionCall");
                    fc.put("name", tc.getName());
                    try {
                        JsonNode args = objectMapper.readTree(
                                tc.getArgumentsJson() != null ? tc.getArgumentsJson() : "{}");
                        fc.set("args", args);
                    } catch (Exception ignored) {
                        fc.putObject("args");
                    }
                }
            } else {
                parts.addObject().put("text", m.getContent() != null ? m.getContent() : "");
            }
        }

        if (req.getTools() != null && !req.getTools().isEmpty()) {
            ArrayNode toolsNode = root.putArray("tools");
            ObjectNode wrap = toolsNode.addObject();
            ArrayNode decls = wrap.putArray("functionDeclarations");
            for (LlmTool t : req.getTools()) {
                ObjectNode d = decls.addObject();
                d.put("name", t.getName());
                if (t.getDescription() != null) d.put("description", t.getDescription());
                if (t.getParametersJsonSchema() != null) {
                    d.set("parameters", objectMapper.valueToTree(t.getParametersJsonSchema()));
                }
            }
        }

        ObjectNode genConfig = root.putObject("generationConfig");
        if (req.getTemperature() != null) genConfig.put("temperature", req.getTemperature());
        if (req.getMaxTokens() != null) genConfig.put("maxOutputTokens", req.getMaxTokens());

        return root;
    }

    private String roleToString(ChatRole role) {
        return switch (role) {
            case USER -> "user";
            case ASSISTANT -> "model";
            case TOOL -> "function";
            case SYSTEM -> "user"; // ulaşmaz — yukarıda filtrelendi
        };
    }

    private LlmResponse parseResponse(String body) {
        try {
            JsonNode root = objectMapper.readTree(body);
            JsonNode candidate = root.path("candidates").path(0);
            String finish = candidate.path("finishReason").asText("STOP");

            StringBuilder text = new StringBuilder();
            List<LlmToolCall> toolCalls = new ArrayList<>();

            JsonNode parts = candidate.path("content").path("parts");
            if (parts.isArray()) {
                int idx = 0;
                for (JsonNode p : parts) {
                    if (p.has("text")) {
                        if (text.length() > 0) text.append("\n");
                        text.append(p.path("text").asText(""));
                    } else if (p.has("functionCall")) {
                        JsonNode fc = p.path("functionCall");
                        toolCalls.add(LlmToolCall.builder()
                                .id("gemini-tc-" + idx)        // Gemini id vermez, üretiyoruz
                                .name(fc.path("name").asText())
                                .argumentsJson(fc.path("args").toString())
                                .build());
                    }
                    idx++;
                }
            }

            // finishReason'u OpenAI tarzı normalize et
            String normalizedFinish = switch (finish) {
                case "STOP" -> toolCalls.isEmpty() ? "stop" : "tool_calls";
                case "MAX_TOKENS" -> "length";
                default -> finish.toLowerCase();
            };

            return LlmResponse.builder()
                    .content(text.toString())
                    .toolCalls(toolCalls)
                    .provider(NAME)
                    .model(model)
                    .finishReason(normalizedFinish)
                    .build();
        } catch (Exception e) {
            throw new LlmException("Gemini yanıtı parse edilemedi: " + e.getMessage(), e, true, 0);
        }
    }
}
