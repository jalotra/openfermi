package com.law.tech.backend.waitlist.models.dtos;

import com.law.tech.backend.base.models.dtos.BaseDto;
import com.law.tech.backend.waitlist.models.WaitlistStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class WaitlistRequestDto extends BaseDto {
    private String email;
    private String name;
    private String message;
    private WaitlistStatus status;
}
