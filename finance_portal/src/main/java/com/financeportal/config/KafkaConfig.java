package com.financeportal.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaConfig {

    // 1. Topic (Kanal): Kullanıcılarla ilgili olayların akacağı kanal
    @Bean
    public NewTopic userEventsTopic() {
        return TopicBuilder.name("user-events")
                .partitions(3)
                .replicas(1)
                .build();
    }

    // 2. Topic (Kanal): Portföy/Piyasa olaylarının akacağı kanal
    @Bean
    public NewTopic marketEventsTopic() {
        return TopicBuilder.name("market-events")
                .partitions(3)
                .replicas(1)
                .build();
    }
}