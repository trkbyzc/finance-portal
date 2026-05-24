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

        // 🚀 ASENKRON GÖNDERİM VE TAKİP
        CompletableFuture<SendResult<String, Object>> future = kafkaTemplate.send(topic, key, event);

        future.whenComplete((result, ex) -> {
            if (ex == null) {
                // Başarılı durum
                log.info("✅ Mesaj başarıyla iletildi! Topic: {}, Partition: {}, Offset: {}",
                        topic,
                        result.getRecordMetadata().partition(),
                        result.getRecordMetadata().offset());
            } else {
                // Hata durumu (Broker çökmüş olabilir, network kopmuş olabilir)
                log.error("❌ Mesaj Kafka'ya iletilemedi! Topic: {}, Hata: {}", topic, ex.getMessage());

                // BURADA ÖNEMLİ: İleride buraya "Retry" mekanizması veya
                // "Hata Veritabanına Kaydet" mantığı eklenebilir.
            }
        });
    }
}