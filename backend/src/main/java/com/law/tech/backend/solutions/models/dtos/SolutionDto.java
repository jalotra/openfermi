package com.law.tech.backend.solutions.models.dtos;

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
public class SolutionDto extends BaseDto {
    private UUID questionId;
    private String hints;
    private String solution;
}
