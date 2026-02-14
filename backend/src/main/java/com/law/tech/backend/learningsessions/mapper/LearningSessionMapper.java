package com.law.tech.backend.learningsessions.mapper;

import com.law.tech.backend.base.mappers.BaseMapper;
import com.law.tech.backend.learningsessions.models.LearningSession;
import com.law.tech.backend.learningsessions.models.dtos.LearningSessionDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface LearningSessionMapper extends BaseMapper<LearningSessionDto, LearningSession> {
    LearningSessionMapper INSTANCE = Mappers.getMapper(LearningSessionMapper.class);

    @Override
    @Mapping(target = "question", ignore = true)
    @Mapping(target = "tutor", ignore = true)
    LearningSession toEntity(LearningSessionDto dto);
}
