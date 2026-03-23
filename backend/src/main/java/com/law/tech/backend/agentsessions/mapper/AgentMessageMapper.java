package com.law.tech.backend.agentsessions.mapper;

import com.law.tech.backend.agentsessions.models.AgentMessage;
import com.law.tech.backend.agentsessions.models.dtos.AgentMessageDto;
import java.util.List;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface AgentMessageMapper {

    AgentMessageMapper INSTANCE = Mappers.getMapper(AgentMessageMapper.class);

    @Mapping(target = "parts", ignore = true)
    AgentMessageDto toDto(AgentMessage entity);

    List<AgentMessageDto> toDtoList(List<AgentMessage> entities);
}
