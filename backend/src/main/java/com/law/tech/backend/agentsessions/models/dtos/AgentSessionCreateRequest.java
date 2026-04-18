package com.law.tech.backend.agentsessions.models.dtos;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AgentSessionCreateRequest {

    @NotBlank
    private String userId;

    private Long sessionTokenCap;

    private Double sessionCostCap;
}
