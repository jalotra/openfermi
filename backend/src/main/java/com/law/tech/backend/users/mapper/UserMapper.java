package com.law.tech.backend.users.mapper;

import com.law.tech.backend.base.mappers.BaseMapper;
import com.law.tech.backend.users.models.User;
import com.law.tech.backend.users.models.dtos.UserDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

@Mapper(
    componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
    unmappedTargetPolicy = ReportingPolicy.IGNORE
)
public interface UserMapper extends BaseMapper<User, UserDto> {
    // Inherits toDto and toEntity from BaseMapper
    // All fields have matching names, so no custom mappings needed
}
