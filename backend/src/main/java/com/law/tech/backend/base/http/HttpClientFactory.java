package com.law.tech.backend.base.http;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import io.github.resilience4j.retrofit.CircuitBreakerCallAdapter;
import java.io.IOException;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import okhttp3.ConnectionPool;
import okhttp3.Interceptor;
import okhttp3.OkHttpClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.util.CollectionUtils;
import retrofit2.Retrofit;
import retrofit2.converter.jackson.JacksonConverterFactory;

@FieldDefaults(level = AccessLevel.PRIVATE)
public class HttpClientFactory implements IBaseClientFactory {

    final BaseConfig defaultConfig;

    @Autowired
    public HttpClientFactory(@Qualifier("defaultCircuitBreakerConfig") BaseConfig defaultConfig) {
        this.defaultConfig = defaultConfig;
    }

    private <T extends BaseClient> T getClient(
            Class<T> clazz, String clientName, BaseConfig config, List<Interceptor> interceptors) {
        // Load all the null props of config into it from defaultConfig
        BaseConfigLoader.loadConfig(defaultConfig, config);

        CircuitBreakerConfig circuitBreakerConfig = CircuitBreakerConfig.custom()
                .failureRateThreshold(config.getFailureRateThreshold())
                .waitDurationInOpenState(Duration.ofMillis(config.getWaitDurationInOpenState()))
                .permittedNumberOfCallsInHalfOpenState(config.getPermittedNumberOfCallsInHalfOpenState())
                .slidingWindowSize(config.getSlidingWindowSize())
                .recordExceptions(IOException.class, TimeoutException.class)
                .build();

        CircuitBreakerRegistry circuitBreakerRegistry = CircuitBreakerRegistry.of(circuitBreakerConfig);

        CircuitBreaker circuitBreaker =
                circuitBreakerRegistry.circuitBreaker(String.format("%s-CircuitBreaker", clientName));

        final OkHttpClient.Builder builder = new OkHttpClient.Builder()
                .callTimeout(Duration.ofMillis(config.getOkHttpCallTimeout()))
                .connectTimeout(Duration.ofMillis(config.getOkHttpSocketTimeout()))
                .readTimeout(Duration.ofMillis(config.getOkHttpReadTimeout()))
                .connectionPool(new ConnectionPool(config.getOkHttpConnectionPool(), 500, TimeUnit.MINUTES));

        if (!CollectionUtils.isEmpty(interceptors)) {
            interceptors.forEach(builder::addInterceptor);
        }

        OkHttpClient httpClient = builder.build();
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        objectMapper.configure(DeserializationFeature.ACCEPT_EMPTY_STRING_AS_NULL_OBJECT, true);
        objectMapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        objectMapper.setSerializationInclusion(JsonInclude.Include.NON_EMPTY);
        objectMapper.setDefaultPropertyInclusion(
                JsonInclude.Value.construct(JsonInclude.Include.NON_NULL, JsonInclude.Include.NON_DEFAULT));

        Retrofit retrofit = new Retrofit.Builder()
                .baseUrl(config.getBaseUrl())
                .addCallAdapterFactory(CircuitBreakerCallAdapter.of(circuitBreaker))
                .client(httpClient)
                .addConverterFactory(new NullOnEmptyConverterFactory())
                .addConverterFactory(JacksonConverterFactory.create(objectMapper))
                .build();

        return retrofit.create(clazz);
    }

    @Override
    public <T extends BaseClient> T get3pClient(Class<T> clazz, String clientName) {
        return getClient(clazz, clientName, defaultConfig, null);
    }

    @Override
    public <T extends BaseClient> T get3pClient(Class<T> clazz, String clientName, BaseConfig config) {
        return getClient(clazz, clientName, config, null);
    }

    @Override
    public <T extends BaseClient> T get3pClient(
            Class<T> clazz, String clientName, BaseConfig config, List<Interceptor> interceptorList) {
        return getClient(clazz, clientName, config, interceptorList);
    }
}
