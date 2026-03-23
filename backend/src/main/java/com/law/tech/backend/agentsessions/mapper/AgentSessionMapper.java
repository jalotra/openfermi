package com.law.tech.backend.agentsessions.mapper;

import com.law.tech.backend.agentsessions.models.AgentSession;
import com.law.tech.backend.agentsessions.models.dtos.AgentSessionDto;
import com.law.tech.backend.base.mappers.BaseMapper;
import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface AgentSessionMapper extends BaseMapper<AgentSessionDto, AgentSession> {
    AgentSessionMapper INSTANCE = Mappers.getMapper(AgentSessionMapper.class);
}
