package com.law.tech.backend.questions.mapper;

import com.law.tech.backend.base.BaseMapper;
import com.law.tech.backend.questions.models.Question;
import com.law.tech.backend.questions.models.dtos.QuestionDto;
import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface QuestionMapper extends BaseMapper<QuestionDto, Question> {
    QuestionMapper INSTANCE = Mappers.getMapper(QuestionMapper.class);
}
