package com.law.tech.backend.tutors.mapper;

import com.law.tech.backend.base.mappers.BaseMapper;
import com.law.tech.backend.tutors.models.Tutor;
import com.law.tech.backend.tutors.models.dtos.TutorDto;
import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface TutorMapper extends BaseMapper<TutorDto, Tutor> {
    TutorMapper INSTANCE = Mappers.getMapper(TutorMapper.class);
}
