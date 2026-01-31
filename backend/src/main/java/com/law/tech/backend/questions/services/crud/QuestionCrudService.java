package com.law.tech.backend.questions.services.crud;

import com.law.tech.backend.base.services.BaseCrudService;
import com.law.tech.backend.base.mappers.BaseMapper;
import com.law.tech.backend.base.repositories.BaseRepository;
import com.law.tech.backend.questions.models.Question;
import com.law.tech.backend.questions.models.dtos.QuestionDto;
import com.law.tech.backend.questions.repositories.QuestionRepository;
import org.springframework.stereotype.Service;

@Service
public class QuestionCrudService extends BaseCrudService<QuestionDto, Question, QuestionRepository> {
    public QuestionCrudService(QuestionRepository repository, BaseMapper<QuestionDto, Question> mapper) {
        super(repository, mapper);
    }
}
