package com.law.tech.backend.presign.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PresignUrlRequest {
    @NotBlank
    String bucket;

    @NotBlank
    String key;

    @Min(1)
    @Max(60)
    Integer expiresInMinutes;
}
