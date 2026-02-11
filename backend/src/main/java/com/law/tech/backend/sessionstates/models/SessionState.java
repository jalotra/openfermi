package com.law.tech.backend.sessionstates.models;

import com.fasterxml.jackson.databind.JsonNode;
import com.law.tech.backend.base.models.BaseEntity;
import com.law.tech.backend.questions.models.Question;
import com.law.tech.backend.sessions.models.Session;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(
        name = "session_states",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_session_states_session_question",
                        columnNames = {"session_id", "question_id"}
                )
        },
        indexes = {
                @Index(name = "idx_session_states_session_id", columnList = "session_id")
        }
)
public class SessionState extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "session_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_session_states_session")
    )
    private Session session;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "question_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_session_states_question")
    )
    private Question question;

    @Column(name = "tldraw_snapshot")
    @JdbcTypeCode(SqlTypes.JSON)
    private JsonNode tldrawSnapshot;
}
