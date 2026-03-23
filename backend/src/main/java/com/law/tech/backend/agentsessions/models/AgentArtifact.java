package com.law.tech.backend.agentsessions.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "agent_artifacts")
public class AgentArtifact {

    @Id
    private String id;

    @Column(name = "product_session_id", nullable = false)
    private String productSessionId;

    @Column(name = "message_id")
    private String messageId;

    @Column(name = "part_id")
    private String partId;

    @Column(name = "storage_key", nullable = false)
    private String storageKey;

    @Column(nullable = false)
    private String mime;

    private Integer bytes;

    private String sha256;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}
