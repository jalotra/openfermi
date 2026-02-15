package com.law.tech.backend.waitlist.services;

import com.law.tech.backend.base.services.BaseCrudService;
import com.law.tech.backend.users.models.User;
import com.law.tech.backend.users.repositories.UserRepository;
import com.law.tech.backend.waitlist.mapper.WaitlistRequestMapper;
import com.law.tech.backend.waitlist.models.WaitlistRequest;
import com.law.tech.backend.waitlist.models.WaitlistStatus;
import com.law.tech.backend.waitlist.models.dtos.WaitlistRequestDto;
import com.law.tech.backend.waitlist.repositories.WaitlistRequestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class WaitlistRequestService extends BaseCrudService<WaitlistRequestDto, WaitlistRequest, WaitlistRequestRepository> {

    private final WaitlistRequestRepository waitlistRepository;
    private final WaitlistRequestMapper mapper;
    private final UserRepository userRepository;

    public WaitlistRequestService(
            WaitlistRequestRepository repository,
            WaitlistRequestMapper mapper,
            UserRepository userRepository) {
        super(repository, mapper);
        this.waitlistRepository = repository;
        this.mapper = mapper;
        this.userRepository = userRepository;
    }

    @Override
    protected void validateBeforeSave(WaitlistRequest entity) {
        if (entity.getEmail() == null || entity.getEmail().isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }
    }

    @Override
    protected void validateBeforeDelete(WaitlistRequest entity) {
    }

    public WaitlistRequestDto submitRequest(String email, String name, String message) {
        Optional<WaitlistRequest> existing = waitlistRepository.findByEmail(email);
        if (existing.isPresent()) {
            return mapper.toDto(existing.get());
        }

        WaitlistRequest request = WaitlistRequest.builder()
                .email(email)
                .name(name)
                .message(message)
                .status(WaitlistStatus.PENDING)
                .build();

        WaitlistRequest saved = save(request);
        return mapper.toDto(saved);
    }

    @Transactional(readOnly = true)
    public Optional<WaitlistRequestDto> findByEmail(String email) {
        return waitlistRepository.findByEmail(email).map(mapper::toDto);
    }

    @Transactional(readOnly = true)
    public List<WaitlistRequestDto> findByStatus(WaitlistStatus status) {
        return waitlistRepository.findByStatus(status).stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }

    public WaitlistRequestDto approveRequest(UUID id) {
        WaitlistRequest request = waitlistRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Waitlist request not found"));

        request.setStatus(WaitlistStatus.APPROVED);
        WaitlistRequest saved = save(request);

        Optional<User> existingUser = userRepository.findByEmail(request.getEmail());
        if (existingUser.isPresent()) {
            User user = existingUser.get();
            user.setApproved(true);
            if (request.getName() != null) user.setName(request.getName());
            userRepository.save(user);
        } else {
            User user = User.builder()
                    .email(request.getEmail())
                    .name(request.getName())
                    .isApproved(true)
                    .isAdmin(false)
                    .build();
            userRepository.save(user);
        }

        return mapper.toDto(saved);
    }

    public WaitlistRequestDto rejectRequest(UUID id) {
        WaitlistRequest request = waitlistRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Waitlist request not found"));

        request.setStatus(WaitlistStatus.REJECTED);
        WaitlistRequest saved = save(request);
        return mapper.toDto(saved);
    }
}
