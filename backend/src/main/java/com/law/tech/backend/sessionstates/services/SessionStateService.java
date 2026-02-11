package com.law.tech.backend.sessionstates.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.law.tech.backend.questions.models.Question;
import com.law.tech.backend.questions.repositories.QuestionRepository;
import com.law.tech.backend.sessions.models.Session;
import com.law.tech.backend.sessions.repositories.SessionRepository;
import com.law.tech.backend.sessionstates.models.SessionState;
import com.law.tech.backend.sessionstates.models.dtos.SessionStateDto;
import com.law.tech.backend.sessionstates.repositories.SessionStateRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class SessionStateService {
    private final SessionStateRepository sessionStateRepository;
    private final SessionRepository sessionRepository;
    private final QuestionRepository questionRepository;

    public SessionStateService(
            SessionStateRepository sessionStateRepository,
            SessionRepository sessionRepository,
            QuestionRepository questionRepository
    ) {
        this.sessionStateRepository = sessionStateRepository;
        this.sessionRepository = sessionRepository;
        this.questionRepository = questionRepository;
    }

    @Transactional(readOnly = true)
    public Optional<SessionStateDto> getState(UUID sessionId, UUID questionId) {
        return sessionStateRepository.findBySession_IdAndQuestion_Id(sessionId, questionId)
                .map(this::toDto);
    }

    @Transactional
    public SessionStateDto upsertState(UUID sessionId, UUID questionId, JsonNode snapshot) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));

        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Question not found"));

        validateQuestionInSession(session, questionId);

        SessionState state = sessionStateRepository.findBySession_IdAndQuestion_Id(sessionId, questionId)
                .orElseGet(() -> SessionState.builder()
                        .session(session)
                        .question(question)
                        .build());

        state.setTldrawSnapshot(snapshot);

        SessionState saved = sessionStateRepository.save(state);
        return toDto(saved);
    }

    private void validateQuestionInSession(Session session, UUID questionId) {
        List<String> questionIds = session.getQuestionIds();
        if (questionIds == null || !questionIds.contains(questionId.toString())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Question does not belong to session"
            );
        }
    }

    private SessionStateDto toDto(SessionState state) {
        return SessionStateDto.builder()
                .id(state.getId())
                .createdAt(state.getCreatedAt())
                .updatedAt(state.getUpdatedAt())
                .createdBy(state.getCreatedBy())
                .updatedBy(state.getUpdatedBy())
                .sessionId(state.getSession().getId())
                .questionId(state.getQuestion().getId())
                .tldrawSnapshot(state.getTldrawSnapshot())
                .build();
    }
}
