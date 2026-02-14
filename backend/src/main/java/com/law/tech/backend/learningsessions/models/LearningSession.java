package com.law.tech.backend.learningsessions.models;

import com.law.tech.backend.base.models.BaseEntity;
import com.law.tech.backend.questions.models.Question;
import com.law.tech.backend.tutors.models.Tutor;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.util.UUID;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "learning_sessions")
public class LearningSession extends BaseEntity {

    @Column(name = "question_id", nullable = false)
    private UUID questionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", insertable = false, updatable = false)
    private Question question;

    @Column(name = "tutor_id", nullable = false)
    private UUID tutorId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tutor_id", insertable = false, updatable = false)
    private Tutor tutor;

    @Column(name = "user_id")
    private String userId;

    @Column(name = "audio_url")
    private String audioUrl;

    @Column(name = "transcript", columnDefinition = "TEXT")
    private String transcript;

    @Column(name = "segments", columnDefinition = "TEXT")
    private String segments;
}
