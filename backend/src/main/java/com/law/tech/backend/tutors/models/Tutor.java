package com.law.tech.backend.tutors.models;

import com.law.tech.backend.base.models.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "tutors", uniqueConstraints = {
    @UniqueConstraint(columnNames = "voice_id")
})
public class Tutor extends BaseEntity {

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "title")
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(name = "voice_id", nullable = false)
    private String voiceId;

    @Column(name = "persona_prompt", columnDefinition = "TEXT")
    private String personaPrompt;

    @Column(name = "active", nullable = false)
    private Boolean active;

    @PrePersist
    @Override
    protected void onCreate() {
        super.onCreate();
        if (active == null) {
            active = true;
        }
    }
}
