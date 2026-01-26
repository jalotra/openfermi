package com.law.tech.backend.sessions.models;

import com.law.tech.backend.base.models.BaseEntity;
import com.law.tech.backend.base.converters.StringListConverter;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "sessions")
public class Session extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "question_ids", columnDefinition = "TEXT")
    @Convert(converter = StringListConverter.class)
    private List<String> questionIds;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    private SessionStatus status;

    @Column(name = "score")
    private Double score;

    @Column(name = "total_questions")
    private Integer totalQuestions;

    @Column(name = "correct_answers")
    private Integer correctAnswers;

    @Column(name = "incorrect_answers")
    private Integer incorrectAnswers;

    @Column(name = "unanswered")
    private Integer unanswered;

    @Column(name = "answers", columnDefinition = "TEXT")
    @Convert(converter = SessionAnswerConverter.class)
    private Map<UUID, String> answers; // Map of questionId -> user's answer

    @Column(name = "time_spent_seconds")
    private Long timeSpentSeconds;

    @Column(name = "exam_type")
    @Enumerated(EnumType.STRING)
    private ExamType examType;

    @Column(name = "subject")
    @Enumerated(EnumType.STRING)
    private Subject subject;

    public enum SessionStatus {
        IN_PROGRESS,
        COMPLETED,
        ABANDONED
    }

    public enum ExamType {
        JEE_ADVANCED,
        JEE_MAIN,
        NEET,
        MIXED
    }

    public enum Subject {
        PHYSICS,
        CHEMISTRY,
        MATHEMATICS,
        BIOLOGY,
        MIXED
    }
}
