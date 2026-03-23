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
@Table(name = "agent_parts")
public class AgentPart {

    @Id
    private String id;

    @Column(name = "message_id", nullable = false)
    private String messageId;

    @Column(name = "product_session_id", nullable = false)
    private String productSessionId;

    @Column(name = "opencode_session_id", nullable = false)
    private String opencodeSessionId;

    @Column(nullable = false)
    private String type;

    @Column(name = "tool_name")
    private String toolName;

    @Column(name = "tool_call_id")
    private String toolCallId;

    @Column(name = "tool_status")
    private String toolStatus;

    @Column(nullable = false, columnDefinition = "jsonb")
    private String data;

    @Column(name = "synced_at", nullable = false)
    private Instant syncedAt;
}
