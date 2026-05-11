package com.financeportal.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class KafkaProducerService {

    // Spring Kafka'nın bize sunduğu hazır mesaj gönderici
    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void sendMessage(String topic, String key, Object event) {
        log.info("Kafka'ya mesaj fırlatılıyor -> Topic: {}, Key: {}, Event: {}", topic, key, event);

        // Mesajı fırlat (Key, hangi partition'a gideceğini belirler)
        kafkaTemplate.send(topic, key, event);
    }
}