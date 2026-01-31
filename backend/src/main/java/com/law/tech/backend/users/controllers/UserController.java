package com.law.tech.backend.users.controllers;

import com.law.tech.backend.base.controllers.BaseController;
import com.law.tech.backend.users.mapper.UserMapper;
import com.law.tech.backend.users.models.User;
import com.law.tech.backend.users.models.dtos.UserDto;
import com.law.tech.backend.users.repositories.UserRepository;
import com.law.tech.backend.users.services.crud.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class UserController extends BaseController<UserDto, User, UserRepository> {

    private final UserService userService;
    private final UserMapper userMapper;

    public UserController(UserService userService, UserMapper userMapper) {
        super(userService, userMapper);
        this.userService = userService;
        this.userMapper = userMapper;
    }

    /**
     * Sync user data from OAuth provider (Better Auth).
     * Creates new user if doesn't exist, updates if exists.
     */
    @PostMapping("/sync")
    public ResponseEntity<UserDto> syncUser(@RequestBody UserSyncRequest request) {
        UserDto user = userService.syncUser(
            request.getEmail(),
            request.getName(),
            request.getAvatarUrl(),
            request.getProvider(),
            request.getProviderId()
        );
        return ResponseEntity.ok(user);
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<UserDto> getByEmail(@PathVariable String email) {
        return userService.findByEmail(email)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/provider/{providerId}")
    public ResponseEntity<UserDto> getByProviderId(@PathVariable String providerId) {
        return userService.findByProviderId(providerId)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    // DTO for user sync request
    public static class UserSyncRequest {
        private String email;
        private String name;
        private String avatarUrl;
        private String provider;
        private String providerId;

        // Getters and Setters
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getAvatarUrl() { return avatarUrl; }
        public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
        public String getProvider() { return provider; }
        public void setProvider(String provider) { this.provider = provider; }
        public String getProviderId() { return providerId; }
        public void setProviderId(String providerId) { this.providerId = providerId; }
    }
}
