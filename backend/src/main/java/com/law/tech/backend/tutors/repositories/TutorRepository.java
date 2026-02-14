package com.law.tech.backend.tutors.repositories;

import com.law.tech.backend.base.repositories.BaseRepository;
import com.law.tech.backend.tutors.models.Tutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TutorRepository extends BaseRepository<Tutor> {
    Optional<Tutor> findByVoiceId(String voiceId);
    List<Tutor> findByActiveTrue();
}
