package com.law.tech.backend.sessions.models.dtos;

import com.law.tech.backend.base.models.dtos.BaseDto;
import com.law.tech.backend.sessions.models.Session;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class SessionDto extends BaseDto {
    private String userId;
    private List<String> questionIds;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Session.SessionStatus status;
    private Double score;
    private Integer totalQuestions;
    private Integer correctAnswers;
    private Integer incorrectAnswers;
    private Integer unanswered;
    private Map<UUID, String> answers; // Map of questionId -> user's answer
    private Long timeSpentSeconds;
    private Session.ExamType examType;
    private Session.Subject subject;
}
