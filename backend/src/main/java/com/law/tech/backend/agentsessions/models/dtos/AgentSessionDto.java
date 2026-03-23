package com.law.tech.backend.agentsessions.models.dtos;

import com.law.tech.backend.base.statemachine.StatefulDto;
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
public class AgentSessionDto extends StatefulDto {
    private String userId;
    private String taskArn;
    private String workerUrl;
    private String opencodeProjectId;
    private String opencodeSessionId;
    private Long tokenUsage;
    private Double cost;
    private Long sessionTokenCap;
    private Double sessionCostCap;
}
