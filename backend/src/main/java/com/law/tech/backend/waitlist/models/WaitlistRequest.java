package com.law.tech.backend.waitlist.models;

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
@Table(name = "waitlist_requests")
public class WaitlistRequest extends BaseEntity {

    @Column(name = "email", unique = true, nullable = false)
    private String email;

    @Column(name = "name")
    private String name;

    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private WaitlistStatus status = WaitlistStatus.PENDING;
}
