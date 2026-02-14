package com.law.tech.backend.learningsessions.models.dtos;

import com.law.tech.backend.base.models.dtos.BaseDto;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.util.UUID;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class LearningSessionDto extends BaseDto {
    private UUID questionId;
    private UUID tutorId;
    private String userId;
    private String audioUrl;
    private String transcript;
    private String segments;
}
