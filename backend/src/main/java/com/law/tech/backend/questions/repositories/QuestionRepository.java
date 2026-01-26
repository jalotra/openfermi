package com.law.tech.backend.questions.repositories;

import com.law.tech.backend.base.BaseRepository;
import com.law.tech.backend.questions.models.Question;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface QuestionRepository extends BaseRepository<Question> {
    List<Question> findBySubject(Question.Subject subject);
    List<Question> findByExamType(Question.ExamType examType);
    List<Question> findBySubjectAndExamType(Question.Subject subject, Question.ExamType examType);
    List<Question> findByDifficulty(Question.DifficultyLevel difficulty);
    List<Question> findByYear(Integer year);
    List<Question> findByIsActive(Boolean isActive);
}
