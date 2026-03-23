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
public class AgentArtifactDto {
    private String id;
    private String productSessionId;
    private String messageId;
    private String partId;
    private String storageKey;
    private String mime;
    private Integer bytes;
    private String sha256;
    private Instant createdAt;
}
