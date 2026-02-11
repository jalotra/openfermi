package com.law.tech.backend.sessionstates.models.dtos;

import com.fasterxml.jackson.databind.JsonNode;
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
public class SessionStateDto extends BaseDto {
    private UUID sessionId;
    private UUID questionId;
    private JsonNode tldrawSnapshot;
}
