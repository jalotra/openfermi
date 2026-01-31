package com.law.tech.backend.base.models.dtos;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PUBLIC)
public class BaseDto {
     UUID id;
     LocalDateTime createdAt;
     LocalDateTime updatedAt;
     String createdBy;
     String updatedBy;
}
