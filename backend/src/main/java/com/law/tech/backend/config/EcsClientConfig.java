package com.law.tech.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.ecs.EcsClient;

@Configuration
public class EcsClientConfig {

    @Value("${aws.region}")
    private String region;

    @Bean
    public EcsClient ecsClient() {
        return EcsClient.builder().region(Region.of(region)).build();
    }
}
