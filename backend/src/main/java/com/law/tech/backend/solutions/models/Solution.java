package com.law.tech.backend.solutions.models;

import com.law.tech.backend.base.models.BaseEntity;
import com.law.tech.backend.questions.models.Question;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.util.UUID;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "solutions", uniqueConstraints = {
    @UniqueConstraint(columnNames = "question_id")
})
public class Solution extends BaseEntity {

    @Column(name = "question_id", nullable = false)
    private UUID questionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", insertable = false, updatable = false)
    private Question question;

    @Column(name = "hints", columnDefinition = "TEXT", nullable = false)
    private String hints;

    @Column(name = "solution", columnDefinition = "TEXT", nullable = false)
    private String solution;
}
