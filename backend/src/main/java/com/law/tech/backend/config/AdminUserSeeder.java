package com.law.tech.backend.config;

import com.law.tech.backend.users.models.User;
import com.law.tech.backend.users.repositories.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class AdminUserSeeder implements CommandLineRunner {

    private static final String ADMIN_EMAIL = "jalotrashivam9@gmail.com";

    private final UserRepository userRepository;

    public AdminUserSeeder(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public void run(String... args) {
        if (userRepository.existsByEmail(ADMIN_EMAIL)) {
            User admin = userRepository.findByEmail(ADMIN_EMAIL).orElse(null);
            if (admin != null && (!admin.isAdmin() || !admin.isApproved())) {
                admin.setAdmin(true);
                admin.setApproved(true);
                userRepository.save(admin);
                log.info("Updated existing user {} to admin", ADMIN_EMAIL);
            }
            return;
        }

        User admin = User.builder()
                .email(ADMIN_EMAIL)
                .name("Shivam Jalotra")
                .isApproved(true)
                .isAdmin(true)
                .build();
        userRepository.save(admin);
        log.info("Seeded admin user: {}", ADMIN_EMAIL);
    }
}
