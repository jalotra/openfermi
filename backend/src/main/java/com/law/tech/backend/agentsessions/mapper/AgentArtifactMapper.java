package com.law.tech.backend.agentsessions.mapper;

import com.law.tech.backend.agentsessions.models.AgentArtifact;
import com.law.tech.backend.agentsessions.models.dtos.AgentArtifactDto;
import java.util.List;
import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface AgentArtifactMapper {

    AgentArtifactMapper INSTANCE = Mappers.getMapper(AgentArtifactMapper.class);

    AgentArtifactDto toDto(AgentArtifact entity);

    List<AgentArtifactDto> toDtoList(List<AgentArtifact> entities);
}
