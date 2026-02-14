package com.law.tech.backend.tutors.services.crud;

import com.law.tech.backend.base.mappers.BaseMapper;
import com.law.tech.backend.base.services.BaseCrudService;
import com.law.tech.backend.tutors.models.Tutor;
import com.law.tech.backend.tutors.models.dtos.TutorDto;
import com.law.tech.backend.tutors.repositories.TutorRepository;
import org.springframework.stereotype.Service;

@Service
public class TutorCrudService extends BaseCrudService<TutorDto, Tutor, TutorRepository> {
    public TutorCrudService(TutorRepository repository, BaseMapper<TutorDto, Tutor> mapper) {
        super(repository, mapper);
    }
}
