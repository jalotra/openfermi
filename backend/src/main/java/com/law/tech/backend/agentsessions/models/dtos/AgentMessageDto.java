package com.law.tech.backend.agentsessions.models.dtos;

import java.time.Instant;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgentMessageDto {
    private String id;
    private String productSessionId;
    private String opencodeSessionId;
    private String role;
    private String agent;
    private String modelId;
    private String providerId;
    private Double cost;
    private Integer tokensInput;
    private Integer tokensOutput;
    private Integer tokensReasoning;
    private String error;
    private Instant createdAt;
    private Instant completedAt;
    private List<AgentPartDto> parts;
}
