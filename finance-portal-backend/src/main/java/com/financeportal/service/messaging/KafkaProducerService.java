package com.financeportal.service.messaging;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

@Service
@Slf4j
public class KafkaProducerService {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    /**
     * Canlı demo sunucusunda Kafka çalıştırılmıyor (tek makine, 2 çekirdek).
     * Broker yokken {@code send()} masum görünür ama değildir: altındaki
     * producer küme meta verisini beklerken çağıran thread'i {@code max.block.ms}
     * kadar — varsayılan 60 saniye — bloklar. Bu çağrı kullanıcı kaydı akışında
     * olduğu için, kapatılmazsa canlıda ilk girişte bir dakikalık donma demekti.
     * Yerelde varsayılan {@code true}; kapatan tek yer application-prod.yml.
     */
    private final boolean enabled;

    public KafkaProducerService(KafkaTemplate<String, Object> kafkaTemplate,
                                @Value("${app.kafka.enabled:true}") boolean enabled) {
        this.kafkaTemplate = kafkaTemplate;
        this.enabled = enabled;
    }

    public void sendMessage(String topic, String key, Object event) {
        if (!enabled) {
            log.debug("Kafka kapalı, olay atlanıyor -> Topic: {}, Key: {}", topic, key);
            return;
        }

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
