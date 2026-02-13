package com.law.tech.backend.base.statemachine;

import com.law.tech.backend.base.models.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
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
@MappedSuperclass
public abstract class StatefulEntity extends BaseEntity {

    @Column(name = "state", nullable = false)
    private String state;

    @Column(name = "previous_state")
    private String previousState;
}
