package com.law.tech.backend.users.repositories;

import com.law.tech.backend.base.repositories.BaseRepository;
import com.law.tech.backend.users.models.User;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends BaseRepository<User> {

    Optional<User> findByEmail(String email);

    Optional<User> findByProviderId(String providerId);

    boolean existsByEmail(String email);

    boolean existsByProviderId(String providerId);
}
