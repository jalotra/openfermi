package com.law.tech.backend.waitlist.repositories;

import com.law.tech.backend.base.repositories.BaseRepository;
import com.law.tech.backend.waitlist.models.WaitlistRequest;
import com.law.tech.backend.waitlist.models.WaitlistStatus;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WaitlistRequestRepository extends BaseRepository<WaitlistRequest> {
    Optional<WaitlistRequest> findByEmail(String email);
    List<WaitlistRequest> findByStatus(WaitlistStatus status);
    boolean existsByEmail(String email);
}
