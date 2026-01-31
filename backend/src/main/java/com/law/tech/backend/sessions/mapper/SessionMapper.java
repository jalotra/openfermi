package com.law.tech.backend.sessions.mapper;

import com.law.tech.backend.base.mappers.BaseMapper;
import com.law.tech.backend.sessions.models.Session;
import com.law.tech.backend.sessions.models.dtos.SessionDto;
import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface SessionMapper extends BaseMapper<SessionDto, Session> {
    SessionMapper INSTANCE = Mappers.getMapper(SessionMapper.class);
}
