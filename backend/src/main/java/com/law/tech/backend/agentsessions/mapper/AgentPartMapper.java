package com.law.tech.backend.agentsessions.mapper;

import com.law.tech.backend.agentsessions.models.AgentPart;
import com.law.tech.backend.agentsessions.models.dtos.AgentPartDto;
import java.util.List;
import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface AgentPartMapper {

    AgentPartMapper INSTANCE = Mappers.getMapper(AgentPartMapper.class);

    AgentPartDto toDto(AgentPart entity);

    List<AgentPartDto> toDtoList(List<AgentPart> entities);
}
