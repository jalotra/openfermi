package com.law.tech.backend.questions.services.crud;

import com.law.tech.backend.base.mappers.BaseMapper;
import com.law.tech.backend.base.services.BaseReadService;
import com.law.tech.backend.base.repositories.BaseRepository;
import com.law.tech.backend.questions.models.Question;
import com.law.tech.backend.questions.models.dtos.QuestionDto;
import com.law.tech.backend.questions.repositories.QuestionRepository;
import org.springframework.stereotype.Service;

@Service
public class QuestionReadService extends BaseReadService<QuestionDto, Question, QuestionRepository> {
    public QuestionReadService(QuestionRepository repository, BaseMapper<QuestionDto, Question> mapper) {
        super(repository, mapper);
    }
}
