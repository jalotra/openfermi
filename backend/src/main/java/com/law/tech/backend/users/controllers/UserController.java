package com.law.tech.backend.users.controllers;

import com.law.tech.backend.base.controllers.BaseController;
import com.law.tech.backend.base.models.GenericResponse;
import com.law.tech.backend.users.mapper.UserMapper;
import com.law.tech.backend.users.models.User;
import com.law.tech.backend.users.models.dtos.UserDto;
import com.law.tech.backend.users.repositories.UserRepository;
import com.law.tech.backend.users.services.crud.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController extends BaseController<UserDto, User, UserRepository> {

    private final UserService userService;
    private final UserMapper userMapper;

    public UserController(UserService userService, UserMapper userMapper) {
        super(userService);
        this.userService = userService;
        this.userMapper = userMapper;
    }

    @PostMapping("/sync")
    public ResponseEntity<GenericResponse<UserDto>> syncUser(@RequestBody UserSyncRequest request) {
        UserDto user = userService.syncUser(
            request.getEmail(),
            request.getName(),
            request.getAvatarUrl(),
            request.getProvider(),
            request.getProviderId()
        );
        return ResponseEntity.ok(
                GenericResponse.<UserDto>builder().data(user).message("Success").build());
    }

    @PostMapping("/invite")
    public ResponseEntity<GenericResponse<UserDto>> inviteUser(@RequestBody InviteRequest request) {
        UserDto user = userService.inviteUser(request.getEmail());
        return ResponseEntity.ok(
                GenericResponse.<UserDto>builder().data(user).message("User invited").build());
    }

    @GetMapping("/me")
    public ResponseEntity<GenericResponse<UserDto>> getMe(@RequestParam String email) {
        return userService.findByEmail(email)
            .map(dto -> ResponseEntity.ok(
                    GenericResponse.<UserDto>builder().data(dto).message("Success").build()))
            .orElse(ResponseEntity.status(404).body(
                    GenericResponse.<UserDto>builder().data(null).message("User not found").build()));
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<GenericResponse<UserDto>> getByEmail(@PathVariable String email) {
        return userService.findByEmail(email)
            .map(dto -> ResponseEntity.ok(
                    GenericResponse.<UserDto>builder().data(dto).message("Success").build()))
            .orElse(ResponseEntity.status(404).body(
                    GenericResponse.<UserDto>builder().data(null).message("User not found").build()));
    }

    @GetMapping("/provider/{providerId}")
    public ResponseEntity<GenericResponse<UserDto>> getByProviderId(@PathVariable String providerId) {
        return userService.findByProviderId(providerId)
            .map(dto -> ResponseEntity.ok(
                    GenericResponse.<UserDto>builder().data(dto).message("Success").build()))
            .orElse(ResponseEntity.status(404).body(
                    GenericResponse.<UserDto>builder().data(null).message("User not found").build()));
    }

    public static class UserSyncRequest {
        private String email;
        private String name;
        private String avatarUrl;
        private String provider;
        private String providerId;

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

    public static class InviteRequest {
        private String email;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
    }
}
