package com.financeportal.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

/**
 * Kafka topic tanımları.
 *
 * <p>Bu {@code NewTopic} bean'leri Spring'in {@code KafkaAdmin}'ini tetikler: açılışta
 * broker'a bağlanıp topic'leri oluşturmaya çalışır. Canlıda broker çalışmıyor ve bu
 * deneme <b>saniyede bir</b> "Node may not be available" uyarısı basıyordu — gerçek
 * sorunları görünmez hale getiren bir gürültü.
 *
 * <p>{@code app.kafka.enabled=false} olduğunda topic bean'i hiç oluşturulmaz; KafkaAdmin
 * yaratacak topic bulamayınca bağlanmayı denemez. Aynı bayrak
 * {@link com.financeportal.service.messaging.KafkaProducerService} tarafında da olay
 * göndermeyi kapatır. Bayrak tanımlı değilse (yerel geliştirme) topic'ler eskisi gibi kurulur.
 */
@Configuration
@ConditionalOnProperty(name = "app.kafka.enabled", havingValue = "true", matchIfMissing = true)
public class KafkaConfig {

    @Bean
    public NewTopic userEventsTopic() {
        return TopicBuilder.name("user-events")
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic marketEventsTopic() {
        return TopicBuilder.name("market-events")
                .partitions(3)
                .replicas(1)
                .build();
    }
}