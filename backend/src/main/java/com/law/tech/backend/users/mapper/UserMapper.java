package com.law.tech.backend.users.mapper;

import com.law.tech.backend.base.mappers.BaseMapper;
import com.law.tech.backend.users.models.User;
import com.law.tech.backend.users.models.dtos.UserDto;
import org.mapstruct.BeanMapping;
import org.mapstruct.Builder;
import org.mapstruct.Mapper;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

@Mapper(
    componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
    unmappedTargetPolicy = ReportingPolicy.IGNORE
)
public interface UserMapper extends BaseMapper<UserDto, User> {
    /**
     * Lombok's @SuperBuilder generates builder setters matching field names (e.g. isAdmin/isApproved),
     * while JavaBeans properties for boolean "isX" fields are typically named without the "is" prefix
     * (admin/approved). MapStruct may choose the builder and silently skip these boolean mappings.
     *
     * Disabling builder usage forces setter-based mapping which correctly maps admin/approved.
     */
    @Override
    @BeanMapping(builder = @Builder(disableBuilder = true))
    UserDto toDto(User entity);

    @Override
    @BeanMapping(builder = @Builder(disableBuilder = true))
    User toEntity(UserDto dto);
}
