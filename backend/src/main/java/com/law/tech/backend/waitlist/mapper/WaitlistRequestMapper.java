package com.law.tech.backend.waitlist.mapper;

import com.law.tech.backend.base.mappers.BaseMapper;
import com.law.tech.backend.waitlist.models.WaitlistRequest;
import com.law.tech.backend.waitlist.models.dtos.WaitlistRequestDto;
import org.mapstruct.Mapper;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

@Mapper(
    componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
    unmappedTargetPolicy = ReportingPolicy.IGNORE
)
public interface WaitlistRequestMapper extends BaseMapper<WaitlistRequestDto, WaitlistRequest> {
}
