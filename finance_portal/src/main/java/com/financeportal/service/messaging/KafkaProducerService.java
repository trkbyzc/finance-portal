package com.financeportal.service.messaging;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

@Service
@Slf4j
@RequiredArgsConstructor
public class KafkaProducerService {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void sendMessage(String topic, String key, Object event) {
        log.info("Kafka'ya iş olayı fırlatılıyor -> Topic: {}, Key: {}", topic, key);

        CompletableFuture<SendResult<String, Object>> future = kafkaTemplate.send(topic, key, event);

        future.whenComplete((result, ex) -> {
            if (ex == null) {
                log.info("Mesaj başarıyla iletildi. Topic: {}, Partition: {}, Offset: {}",
                        topic,
                        result.getRecordMetadata().partition(),
                        result.getRecordMetadata().offset());
            } else {
                // Broker veya network hatası; şimdilik yalnızca loglanıyor.
                // Retry/dead-letter mekanizması bu bloğa eklenmelidir.
                log.error("Mesaj Kafka'ya iletilemedi. Topic: {}, Hata: {}", topic, ex.getMessage());
            }
        });
    }
}