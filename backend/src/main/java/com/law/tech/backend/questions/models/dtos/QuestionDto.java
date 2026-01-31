package com.law.tech.backend.questions.models.dtos;

import com.law.tech.backend.base.models.dtos.BaseDto;
import com.law.tech.backend.questions.models.Question;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.util.List;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class QuestionDto extends BaseDto {
    private String questionText;
    private Question.Subject subject;
    private Question.ExamType examType;
    private Question.DifficultyLevel difficulty;
    private List<String> options;
    private String correctAnswer;
    private String explanation;
    private List<String> imageUrls;
    private Integer year;
    private Integer paperNumber;
    private Integer questionNumber;
    private List<String> tags;
    private String topic;
    private Integer marks;
    private Double negativeMarks;
    private Boolean isActive;
}
