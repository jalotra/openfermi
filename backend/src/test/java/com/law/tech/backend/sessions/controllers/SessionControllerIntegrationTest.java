package com.law.tech.backend.sessions.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.law.tech.backend.base.AbstractIntegrationTest;
import com.law.tech.backend.base.models.GenericResponse;
import com.law.tech.backend.sessions.models.Session;
import com.law.tech.backend.sessions.models.SessionState;
import com.law.tech.backend.sessions.models.dtos.SessionDto;
import com.law.tech.backend.sessions.repositories.SessionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDateTime;
import java.util.*;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@AutoConfigureWebMvc
class SessionControllerIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private MockMvc mockMvc;
    private SessionDto testSessionDto;
    private Session testSession;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
        sessionRepository.deleteAll();

        testSessionDto = SessionDto.builder()
                .userId("test-user-123")
                .questionIds(Arrays.asList("question-1", "question-2", "question-3"))
                .startTime(LocalDateTime.now())
                .score(0.0)
                .totalQuestions(3)
                .correctAnswers(0)
                .incorrectAnswers(0)
                .unanswered(3)
                .answers(new HashMap<>())
                .timeSpentSeconds(0L)
                .examType(Session.ExamType.JEE_MAIN)
                .subject(Session.Subject.PHYSICS)
                .build();

        testSession = new Session();
        testSession.setUserId("existing-user-456");
        testSession.setQuestionIds(Arrays.asList("question-4", "question-5"));
        testSession.setStartTime(LocalDateTime.now().minusMinutes(30));
        testSession.setState(SessionState.ENDED.name());
        testSession.setScore(85.5);
        testSession.setTotalQuestions(2);
        testSession.setCorrectAnswers(2);
        testSession.setIncorrectAnswers(0);
        testSession.setUnanswered(0);
        testSession.setAnswers(new HashMap<>());
        testSession.setTimeSpentSeconds(1800L);
        testSession.setExamType(Session.ExamType.JEE_ADVANCED);
        testSession.setSubject(Session.Subject.CHEMISTRY);
    }

    @Test
    @DisplayName("Should create a new session in DRAFT state")
    void testCreateSession() throws Exception {
        mockMvc.perform(post("/sessions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(testSessionDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", notNullValue()))
                .andExpect(jsonPath("$.data.userId", is("test-user-123")))
                .andExpect(jsonPath("$.data.state", is("DRAFT")))
                .andExpect(jsonPath("$.data.examType", is("JEE_MAIN")))
                .andExpect(jsonPath("$.data.subject", is("PHYSICS")))
                .andExpect(jsonPath("$.data.totalQuestions", is(3)))
                .andExpect(jsonPath("$.data.questionIds", hasSize(3)))
                .andExpect(jsonPath("$.data.id", notNullValue()))
                .andExpect(jsonPath("$.data.createdAt", notNullValue()));
    }

    @Test
    @DisplayName("Should get session by ID")
    void testGetSessionById() throws Exception {
        Session savedSession = sessionRepository.save(testSession);

        mockMvc.perform(get("/sessions/{id}", savedSession.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", notNullValue()))
                .andExpect(jsonPath("$.data.id", is(savedSession.getId().toString())))
                .andExpect(jsonPath("$.data.userId", is("existing-user-456")))
                .andExpect(jsonPath("$.data.state", is("ENDED")))
                .andExpect(jsonPath("$.data.score", is(85.5)));
    }

    @Test
    @DisplayName("Should return error when session not found")
    void testGetSessionByIdNotFound() throws Exception {
        UUID nonExistentId = UUID.randomUUID();
        mockMvc.perform(get("/sessions/{id}", nonExistentId))
                .andExpect(status().is5xxServerError());
    }

    @Test
    @DisplayName("Should update an existing session")
    void testUpdateSession() throws Exception {
        Session savedSession = sessionRepository.save(testSession);

        SessionDto updateDto = SessionDto.builder()
                .id(savedSession.getId())
                .userId("updated-user-789")
                .questionIds(Arrays.asList("question-4", "question-5", "question-6"))
                .startTime(savedSession.getStartTime())
                .endTime(LocalDateTime.now())
                .state(SessionState.ENDED.name())
                .score(90.0)
                .totalQuestions(3)
                .correctAnswers(2)
                .incorrectAnswers(1)
                .unanswered(0)
                .answers(Map.of(UUID.randomUUID(), "answer-A"))
                .timeSpentSeconds(2400L)
                .examType(Session.ExamType.NEET)
                .subject(Session.Subject.BIOLOGY)
                .build();

        mockMvc.perform(post("/sessions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", notNullValue()))
                .andExpect(jsonPath("$.data.id", is(savedSession.getId().toString())))
                .andExpect(jsonPath("$.data.score", is(90.0)))
                .andExpect(jsonPath("$.data.examType", is("NEET")))
                .andExpect(jsonPath("$.data.subject", is("BIOLOGY")));
    }

    @Test
    @DisplayName("Should delete a session")
    void testDeleteSession() throws Exception {
        Session savedSession = sessionRepository.save(testSession);

        mockMvc.perform(delete("/sessions/{id}", savedSession.getId()))
                .andExpect(status().isOk());

        assertFalse(sessionRepository.existsById(savedSession.getId()));
    }

    @Test
    @DisplayName("Should return error when deleting non-existent session")
    void testDeleteSessionNotFound() throws Exception {
        UUID nonExistentId = UUID.randomUUID();
        mockMvc.perform(delete("/sessions/{id}", nonExistentId))
                .andExpect(status().is5xxServerError());
    }

    @Test
    @DisplayName("Should get all sessions with pagination")
    void testGetAllSessions() throws Exception {
        sessionRepository.save(testSession);
        Session session2 = new Session();
        session2.setUserId("user-2");
        session2.setState(SessionState.DRAFT.name());
        session2.setExamType(Session.ExamType.JEE_MAIN);
        session2.setSubject(Session.Subject.MATHEMATICS);
        session2.setQuestionIds(new ArrayList<>());
        session2.setAnswers(new HashMap<>());
        sessionRepository.save(session2);

        mockMvc.perform(get("/sessions")
                .param("page", "0")
                .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", notNullValue()))
                .andExpect(jsonPath("$.data", hasSize(2)))
                .andExpect(jsonPath("$.data[*].userId", hasItems("existing-user-456", "user-2")));
    }

    @Test
    @DisplayName("Should get sessions with sorting")
    void testGetSessionsWithSorting() throws Exception {
        sessionRepository.save(testSession);
        Session session2 = new Session();
        session2.setUserId("user-2");
        session2.setState(SessionState.DRAFT.name());
        session2.setExamType(Session.ExamType.JEE_MAIN);
        session2.setSubject(Session.Subject.MATHEMATICS);
        session2.setQuestionIds(new ArrayList<>());
        session2.setAnswers(new HashMap<>());
        sessionRepository.save(session2);

        mockMvc.perform(get("/sessions/sorted")
                .param("direction", "DESC")
                .param("sortBy", "createdAt")
                .param("page", "0")
                .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", notNullValue()))
                .andExpect(jsonPath("$.data", hasSize(2)));
    }

    @Test
    @DisplayName("Should get session count")
    void testGetSessionCount() throws Exception {
        sessionRepository.save(testSession);
        Session session2 = new Session();
        session2.setUserId("user-2");
        session2.setState(SessionState.DRAFT.name());
        session2.setExamType(Session.ExamType.JEE_MAIN);
        session2.setSubject(Session.Subject.MATHEMATICS);
        session2.setQuestionIds(new ArrayList<>());
        session2.setAnswers(new HashMap<>());
        sessionRepository.save(session2);

        mockMvc.perform(get("/sessions/count"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", is(2)));
    }

    @Test
    @DisplayName("Should transition session through lifecycle: DRAFT -> LIVE -> PAUSED -> LIVE -> ENDED")
    void testSessionLifecycleTransitions() throws Exception {
        SessionDto sessionDto = SessionDto.builder()
                .userId("lifecycle-test-user")
                .questionIds(Arrays.asList("q1", "q2"))
                .totalQuestions(2)
                .correctAnswers(0)
                .incorrectAnswers(0)
                .unanswered(2)
                .answers(new HashMap<>())
                .timeSpentSeconds(0L)
                .timeLeftSeconds(3600L)
                .examType(Session.ExamType.MIXED)
                .subject(Session.Subject.MIXED)
                .build();

        var createResult = mockMvc.perform(post("/sessions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(sessionDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.state", is("DRAFT")))
                .andReturn();

        String content = createResult.getResponse().getContentAsString();
        GenericResponse<SessionDto> response = objectMapper.readValue(content,
                objectMapper.getTypeFactory().constructParametricType(GenericResponse.class, SessionDto.class));
        String sessionId = response.getData().getId().toString();

        // DRAFT -> LIVE
        mockMvc.perform(post("/sessions/{id}/transition", sessionId)
                .param("event", "START"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.state", is("LIVE")))
                .andExpect(jsonPath("$.data.previousState", is("DRAFT")))
                .andExpect(jsonPath("$.data.startTime", notNullValue()));

        // LIVE -> PAUSED
        mockMvc.perform(post("/sessions/{id}/transition", sessionId)
                .param("event", "PAUSE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.state", is("PAUSED")))
                .andExpect(jsonPath("$.data.previousState", is("LIVE")));

        // PAUSED -> LIVE
        mockMvc.perform(post("/sessions/{id}/transition", sessionId)
                .param("event", "RESUME"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.state", is("LIVE")))
                .andExpect(jsonPath("$.data.previousState", is("PAUSED")));

        // LIVE -> ENDED
        mockMvc.perform(post("/sessions/{id}/transition", sessionId)
                .param("event", "END"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.state", is("ENDED")))
                .andExpect(jsonPath("$.data.previousState", is("LIVE")))
                .andExpect(jsonPath("$.data.endTime", notNullValue()));
    }

    @Test
    @DisplayName("Should reject invalid transition")
    void testInvalidTransition() throws Exception {
        SessionDto sessionDto = SessionDto.builder()
                .userId("invalid-transition-user")
                .questionIds(Arrays.asList("q1"))
                .totalQuestions(1)
                .answers(new HashMap<>())
                .timeSpentSeconds(0L)
                .examType(Session.ExamType.MIXED)
                .subject(Session.Subject.MIXED)
                .build();

        var createResult = mockMvc.perform(post("/sessions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(sessionDto)))
                .andExpect(status().isOk())
                .andReturn();

        String content = createResult.getResponse().getContentAsString();
        GenericResponse<SessionDto> response = objectMapper.readValue(content,
                objectMapper.getTypeFactory().constructParametricType(GenericResponse.class, SessionDto.class));
        String sessionId = response.getData().getId().toString();

        // DRAFT -> PAUSE should fail (invalid transition)
        mockMvc.perform(post("/sessions/{id}/transition", sessionId)
                .param("event", "PAUSE"))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("Should get available events for a session")
    void testGetAvailableEvents() throws Exception {
        SessionDto sessionDto = SessionDto.builder()
                .userId("events-test-user")
                .questionIds(Arrays.asList("q1"))
                .totalQuestions(1)
                .answers(new HashMap<>())
                .timeSpentSeconds(0L)
                .examType(Session.ExamType.MIXED)
                .subject(Session.Subject.MIXED)
                .build();

        var createResult = mockMvc.perform(post("/sessions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(sessionDto)))
                .andExpect(status().isOk())
                .andReturn();

        String content = createResult.getResponse().getContentAsString();
        GenericResponse<SessionDto> response = objectMapper.readValue(content,
                objectMapper.getTypeFactory().constructParametricType(GenericResponse.class, SessionDto.class));
        String sessionId = response.getData().getId().toString();

        mockMvc.perform(get("/sessions/{id}/available-events", sessionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasItem("START")));
    }
}
