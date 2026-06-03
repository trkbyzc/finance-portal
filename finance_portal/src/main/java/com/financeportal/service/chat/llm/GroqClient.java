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
 * Groq LLM provider — OpenAI uyumlu chat-completions API.
 * Endpoint: POST {base-url}/chat/completions
 * Auth: Authorization: Bearer {api-key}
 */
@Component
@Slf4j
public class GroqClient implements LlmClient {

    private static final String NAME = "groq";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final String baseUrl;
    private final String model;
    private final String apiKey;

    public GroqClient(@Qualifier("llmRestTemplate") RestTemplate restTemplate,
                      ObjectMapper objectMapper,
                      @Value("${app.llm.groq.base-url}") String baseUrl,
                      @Value("${app.llm.groq.model}") String model,
                      @Value("${app.llm.groq.api-key:}") String apiKey) {
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
            throw new LlmException("Groq API key konfigüre edilmemiş", true, 0);
        }
        try {
            ObjectNode body = buildRequestBody(request);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);
            HttpEntity<String> entity = new HttpEntity<>(body.toString(), headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    baseUrl + "/chat/completions",
                    HttpMethod.POST,
                    entity,
                    String.class
            );
            return parseResponse(response.getBody());
        } catch (HttpClientErrorException e) {
            int status = e.getStatusCode().value();
            // 429 (rate limit) retriable; 4xx genel olarak değil ama 408/425 hariç tutmuyoruz çünkü
            // nadir ve gateway zaten fallback için elden geçirir.
            boolean retriable = status == 429 || status == 408 || status == 425;
            log.warn("[LLM/groq] HTTP {} — {}", status, e.getResponseBodyAsString());
            throw new LlmException("Groq " + status + ": " + e.getMessage(), e, retriable, status);
        } catch (HttpServerErrorException e) {
            log.warn("[LLM/groq] 5xx — {}", e.getMessage());
            throw new LlmException("Groq 5xx: " + e.getMessage(), e, true, e.getStatusCode().value());
        } catch (ResourceAccessException e) {
            log.warn("[LLM/groq] timeout/IO — {}", e.getMessage());
            throw new LlmException("Groq network: " + e.getMessage(), e, true, 0);
        } catch (Exception e) {
            log.error("[LLM/groq] beklenmeyen hata", e);
            throw new LlmException("Groq beklenmeyen: " + e.getMessage(), e, true, 0);
        }
    }

    // ---------- request build ----------

    private ObjectNode buildRequestBody(LlmRequest req) {
        ObjectNode root = objectMapper.createObjectNode();
        root.put("model", model);

        ArrayNode messages = root.putArray("messages");
        if (req.getMessages() != null) {
            for (LlmMessage m : req.getMessages()) {
                messages.add(toOpenAiMessage(m));
            }
        }

        if (req.getTools() != null && !req.getTools().isEmpty()) {
            ArrayNode toolsNode = root.putArray("tools");
            for (LlmTool t : req.getTools()) {
                ObjectNode wrap = toolsNode.addObject();
                wrap.put("type", "function");
                ObjectNode fn = wrap.putObject("function");
                fn.put("name", t.getName());
                if (t.getDescription() != null) fn.put("description", t.getDescription());
                if (t.getParametersJsonSchema() != null) {
                    fn.set("parameters", objectMapper.valueToTree(t.getParametersJsonSchema()));
                }
            }
            root.put("tool_choice", "auto");
        }

        if (req.getTemperature() != null) root.put("temperature", req.getTemperature());
        if (req.getMaxTokens() != null) root.put("max_tokens", req.getMaxTokens());

        return root;
    }

    private ObjectNode toOpenAiMessage(LlmMessage m) {
        ObjectNode n = objectMapper.createObjectNode();
        n.put("role", roleToString(m.getRole()));
        if (m.getContent() != null) {
            n.put("content", m.getContent());
        }
        if (m.getRole() == ChatRole.TOOL) {
            if (m.getToolCallId() != null) n.put("tool_call_id", m.getToolCallId());
            if (m.getToolName() != null) n.put("name", m.getToolName());
        }
        if (m.getRole() == ChatRole.ASSISTANT && m.getToolCalls() != null && !m.getToolCalls().isEmpty()) {
            ArrayNode tcs = n.putArray("tool_calls");
            for (LlmToolCall c : m.getToolCalls()) {
                ObjectNode tc = tcs.addObject();
                tc.put("id", c.getId() != null ? c.getId() : "");
                tc.put("type", "function");
                ObjectNode fn = tc.putObject("function");
                fn.put("name", c.getName());
                fn.put("arguments", c.getArgumentsJson() != null ? c.getArgumentsJson() : "{}");
            }
        }
        return n;
    }

    private String roleToString(ChatRole role) {
        return switch (role) {
            case USER -> "user";
            case ASSISTANT -> "assistant";
            case SYSTEM -> "system";
            case TOOL -> "tool";
        };
    }

    // ---------- response parse ----------

    private LlmResponse parseResponse(String body) {
        try {
            JsonNode root = objectMapper.readTree(body);
            JsonNode choice = root.path("choices").path(0);
            JsonNode msg = choice.path("message");
            String content = msg.path("content").asText("");
            String finish = choice.path("finish_reason").asText("stop");

            List<LlmToolCall> toolCalls = new ArrayList<>();
            JsonNode tcs = msg.path("tool_calls");
            if (tcs.isArray()) {
                for (JsonNode tc : tcs) {
                    toolCalls.add(LlmToolCall.builder()
                            .id(tc.path("id").asText())
                            .name(tc.path("function").path("name").asText())
                            .argumentsJson(tc.path("function").path("arguments").asText("{}"))
                            .build());
                }
            }

            return LlmResponse.builder()
                    .content(content)
                    .toolCalls(toolCalls)
                    .provider(NAME)
                    .model(model)
                    .finishReason(finish)
                    .build();
        } catch (Exception e) {
            throw new LlmException("Groq yanıtı parse edilemedi: " + e.getMessage(), e, true, 0);
        }
    }
}
