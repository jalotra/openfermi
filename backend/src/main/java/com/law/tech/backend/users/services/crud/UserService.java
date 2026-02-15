package com.law.tech.backend.users.services.crud;

import com.law.tech.backend.base.services.BaseCrudService;
import com.law.tech.backend.users.mapper.UserMapper;
import com.law.tech.backend.users.models.User;
import com.law.tech.backend.users.models.dtos.UserDto;
import com.law.tech.backend.users.repositories.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

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
    }

    @Transactional(readOnly = true)
    public Optional<UserDto> findByEmail(String email) {
        return repository.findByEmail(email).map(mapper::toDto);
    }

    @Transactional(readOnly = true)
    public Optional<UserDto> findByProviderId(String providerId) {
        return repository.findByProviderId(providerId).map(mapper::toDto);
    }

    public UserDto syncUser(String email, String name, String avatarUrl, String provider, String providerId) {
        Optional<User> existingUser = repository.findByEmail(email);

        if (existingUser.isPresent()) {
            User user = existingUser.get();

            if (!user.isApproved()) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User is not approved");
            }

            user.setName(name);
            user.setAvatarUrl(avatarUrl);
            user.setProvider(provider);
            user.setProviderId(providerId);
            user.setLastLoginAt(LocalDateTime.now());
            User saved = save(user);
            return mapper.toDto(saved);
        }

        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User not invited. Please request access.");
    }

    public UserDto inviteUser(String email) {
        Optional<User> existing = repository.findByEmail(email);
        if (existing.isPresent()) {
            User user = existing.get();
            user.setApproved(true);
            User saved = save(user);
            return mapper.toDto(saved);
        }

        User user = User.builder()
                .email(email)
                .isApproved(true)
                .isAdmin(false)
                .build();
        User saved = save(user);
        return mapper.toDto(saved);
    }

    @Transactional(readOnly = true)
    public Optional<UserDto> findById(UUID id) {
        return repository.findById(id).map(mapper::toDto);
    }
}
