package com.law.tech.backend.base.http;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BaseConfig {
    String baseUrl;
    Integer slidingWindowSize;
    Integer permittedNumberOfCallsInHalfOpenState;
    Integer waitDurationInOpenState;
    Integer failureRateThreshold;
    private Integer eventConsumerBufferSize;
    private Boolean registerHealthIndicator;
    private Integer okHttpSocketTimeout;
    private Integer okHttpReadTimeout;
    private Integer okHttpCallTimeout;
    private Integer okHttpConnectionPool;
}
