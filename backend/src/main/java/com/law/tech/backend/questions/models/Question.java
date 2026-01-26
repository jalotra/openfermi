package com.law.tech.backend.questions.models;

import com.law.tech.backend.base.models.BaseEntity;
import com.law.tech.backend.base.converters.StringListConverter;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "questions")
public class Question extends BaseEntity {

    @Column(name = "question_text", columnDefinition = "TEXT", nullable = false)
    private String questionText;

    @Column(name = "subject", nullable = false)
    @Enumerated(EnumType.STRING)
    private Subject subject;

    @Column(name = "exam_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private ExamType examType;

    @Column(name = "difficulty")
    @Enumerated(EnumType.STRING)
    private DifficultyLevel difficulty;

    @Column(name = "options", columnDefinition = "TEXT")
    @Convert(converter = StringListConverter.class)
    private List<String> options;

    @Column(name = "correct_answer", columnDefinition = "TEXT")
    private String correctAnswer;

    @Column(name = "explanation", columnDefinition = "TEXT")
    private String explanation;

    @Column(name = "image_urls", columnDefinition = "TEXT")
    @Convert(converter = StringListConverter.class)
    private List<String> imageUrls;

    @Column(name = "year")
    private Integer year;

    @Column(name = "paper_number")
    private Integer paperNumber;

    @Column(name = "question_number")
    private Integer questionNumber;

    @Column(name = "tags", columnDefinition = "TEXT")
    @Convert(converter = StringListConverter.class)
    private List<String> tags;

    @Column(name = "topic")
    private String topic;

    @Column(name = "marks")
    private Integer marks;

    @Column(name = "negative_marks")
    private Double negativeMarks;

    @Column(name = "is_active")
    private Boolean isActive = true;

    public enum Subject {
        PHYSICS,
        CHEMISTRY,
        MATHEMATICS,
        BIOLOGY
    }

    public enum ExamType {
        JEE_ADVANCED,
        JEE_MAIN,
        NEET
    }

    public enum DifficultyLevel {
        EASY,
        MEDIUM,
        HARD
    }
}
