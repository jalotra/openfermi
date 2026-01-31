package com.law.tech.backend.users.services.crud;

import com.law.tech.backend.base.services.BaseCrudService;
import com.law.tech.backend.users.mapper.UserMapper;
import com.law.tech.backend.users.models.User;
import com.law.tech.backend.users.models.dtos.UserDto;
import com.law.tech.backend.users.repositories.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class UserService extends BaseCrudService<UserDto, User, UserRepository> {

    private final UserMapper mapper;

    public UserService(UserRepository repository, UserMapper mapper) {
        super(repository, mapper);
        this.mapper = mapper;
    }

    @Override
    protected void validateBeforeSave(User entity) {
        if (entity.getEmail() == null || entity.getEmail().isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }
    }

    @Override
    protected void validateBeforeDelete(User entity) {
        // No special validation needed for deletion
    }

    @Transactional(readOnly = true)
    public Optional<UserDto> findByEmail(String email) {
        return repository.findByEmail(email).map(mapper::toDto);
    }

    @Transactional(readOnly = true)
    public Optional<UserDto> findByProviderId(String providerId) {
        return repository.findByProviderId(providerId).map(mapper::toDto);
    }

    /**
     * Sync user from OAuth provider (Better Auth).
     * Creates new user if doesn't exist, or updates existing user.
     */
    public UserDto syncUser(String email, String name, String avatarUrl, String provider, String providerId) {
        Optional<User> existingUser = repository.findByProviderId(providerId);

        User user;
        if (existingUser.isPresent()) {
            // Update existing user
            user = existingUser.get();
            user.setName(name);
            user.setAvatarUrl(avatarUrl);
            user.setLastLoginAt(LocalDateTime.now());
        } else {
            // Check if email already exists with different provider
            Optional<User> emailUser = repository.findByEmail(email);
            if (emailUser.isPresent()) {
                throw new IllegalArgumentException("Email already registered with different provider");
            }

            // Create new user
            user = User.builder()
                .email(email)
                .name(name)
                .avatarUrl(avatarUrl)
                .provider(provider)
                .providerId(providerId)
                .lastLoginAt(LocalDateTime.now())
                .build();
        }

        User saved = save(user);
        return mapper.toDto(saved);
    }

    @Transactional(readOnly = true)
    public Optional<UserDto> findById(UUID id) {
        return repository.findById(id).map(mapper::toDto);
    }
}
