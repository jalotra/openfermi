package com.law.tech.backend.agentsessions.models;

import com.law.tech.backend.base.statemachine.StatefulEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "agent_sessions")
public class AgentSession extends StatefulEntity {

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "task_arn")
    private String taskArn;

    @Column(name = "worker_url")
    private String workerUrl;

    @Column(name = "opencode_project_id")
    private String opencodeProjectId;

    @Column(name = "opencode_session_id")
    private String opencodeSessionId;

    @Column(name = "token_usage", nullable = false)
    private Long tokenUsage;

    @Column(name = "cost", nullable = false)
    private Double cost;

    @Column(name = "session_token_cap")
    private Long sessionTokenCap;

    @Column(name = "session_cost_cap")
    private Double sessionCostCap;
}
