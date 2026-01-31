package com.law.tech.backend.config;

import com.law.tech.backend.base.http.BaseConfig;
import com.law.tech.backend.base.http.HttpClientFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ThirdPartyHttpClientConfig {

    @Bean(value = "defaultCircuitBreakerConfig")
    @ConfigurationProperties("clients.circuitbreakerdefaultconfigs")
    public BaseConfig getBaseConfigForCircuitBreaker() {
        return new BaseConfig();
    }

    @Bean(value = "httpClientFactory")
    public HttpClientFactory getHttpClientFactory(@Qualifier("defaultCircuitBreakerConfig") BaseConfig baseConfig) {
        return new HttpClientFactory(baseConfig);
    }
}
