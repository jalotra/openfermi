package com.law.tech.backend.tutors.services.crud;

import com.law.tech.backend.base.mappers.BaseMapper;
import com.law.tech.backend.base.services.BaseReadService;
import com.law.tech.backend.tutors.models.Tutor;
import com.law.tech.backend.tutors.models.dtos.TutorDto;
import com.law.tech.backend.tutors.repositories.TutorRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class TutorReadService extends BaseReadService<TutorDto, Tutor, TutorRepository> {

    private final TutorRepository tutorRepository;
    private final BaseMapper<TutorDto, Tutor> mapper;

    public TutorReadService(TutorRepository repository, BaseMapper<TutorDto, Tutor> mapper) {
        super(repository, mapper);
        this.tutorRepository = repository;
        this.mapper = mapper;
    }

    public Optional<TutorDto> findByVoiceId(String voiceId) {
        return tutorRepository.findByVoiceId(voiceId).map(mapper::toDto);
    }

    public List<TutorDto> findActive() {
        return tutorRepository.findByActiveTrue().stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }
}
