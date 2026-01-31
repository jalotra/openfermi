package com.law.tech.backend.users.models.dtos;

import com.law.tech.backend.base.models.dtos.BaseDto;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class UserDto extends BaseDto {
    private String email;
    private String name;
    private String avatarUrl;
    private String provider;
    private String providerId;
    private LocalDateTime lastLoginAt;
}
