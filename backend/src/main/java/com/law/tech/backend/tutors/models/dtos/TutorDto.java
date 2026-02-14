package com.law.tech.backend.tutors.models.dtos;

import com.law.tech.backend.base.models.dtos.BaseDto;
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
public class TutorDto extends BaseDto {
    private String name;
    private String title;
    private String description;
    private String avatarUrl;
    private String voiceId;
    private String personaPrompt;
    private Boolean active;
}
