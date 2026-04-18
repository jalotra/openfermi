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
@Table(name = "agent_messages")
public class AgentMessage {

    @Id
    private String id;

    @Column(name = "product_session_id", nullable = false)
    private String productSessionId;

    @Column(name = "opencode_session_id", nullable = false)
    private String opencodeSessionId;

    @Column(nullable = false)
    private String role;

    private String agent;

    @Column(name = "model_id")
    private String modelId;

    @Column(name = "provider_id")
    private String providerId;

    @Column(nullable = false)
    private Double cost;

    @Column(name = "tokens_input", nullable = false)
    private Integer tokensInput;

    @Column(name = "tokens_output", nullable = false)
    private Integer tokensOutput;

    @Column(name = "tokens_reasoning", nullable = false)
    private Integer tokensReasoning;

    @Column(columnDefinition = "jsonb")
    private String error;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "synced_at", nullable = false)
    private Instant syncedAt;
}
