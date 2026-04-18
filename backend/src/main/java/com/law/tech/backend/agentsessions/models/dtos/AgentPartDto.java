package com.law.tech.backend.agentsessions.models.dtos;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgentPartDto {
    private String id;
    private String messageId;
    private String productSessionId;
    private String opencodeSessionId;
    private String type;
    private String toolName;
    private String toolCallId;
    private String toolStatus;
    private String data;
    private Instant syncedAt;
}
