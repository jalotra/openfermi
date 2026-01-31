package com.law.tech.backend.sessions.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.law.tech.backend.base.AbstractIntegrationTest;
import com.law.tech.backend.base.models.GenericResponse;
import com.law.tech.backend.sessions.models.Session;
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
                .status(Session.SessionStatus.IN_PROGRESS)
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
        testSession.setStatus(Session.SessionStatus.COMPLETED);
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
    @DisplayName("Should create a new session")
    void testCreateSession() throws Exception {
        mockMvc.perform(post("/sessions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(testSessionDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", notNullValue()))
                .andExpect(jsonPath("$.data.userId", is("test-user-123")))
                .andExpect(jsonPath("$.data.status", is("IN_PROGRESS")))
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
                .andExpect(jsonPath("$.data.status", is("COMPLETED")))
                .andExpect(jsonPath("$.data.score", is(85.5)));
    }

    @Test
    @DisplayName("Should return 404 when session not found")
    void testGetSessionByIdNotFound() throws Exception {
        UUID nonExistentId = UUID.randomUUID();
        mockMvc.perform(get("/sessions/{id}", nonExistentId))
                .andExpect(status().isNotFound());
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
                .status(Session.SessionStatus.COMPLETED)
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

        mockMvc.perform(put("/sessions/{id}", savedSession.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", notNullValue()))
                .andExpect(jsonPath("$.data.id", is(savedSession.getId().toString())))
                .andExpect(jsonPath("$.data.userId", is("updated-user-789")))
                .andExpect(jsonPath("$.data.status", is("COMPLETED")))
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
    @DisplayName("Should return 404 when deleting non-existent session")
    void testDeleteSessionNotFound() throws Exception {
        UUID nonExistentId = UUID.randomUUID();
        mockMvc.perform(delete("/sessions/{id}", nonExistentId))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Should get all sessions with pagination")
    void testGetAllSessions() throws Exception {
        sessionRepository.save(testSession);
        Session session2 = new Session();
        session2.setUserId("user-2");
        session2.setStatus(Session.SessionStatus.IN_PROGRESS);
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
        session2.setStatus(Session.SessionStatus.IN_PROGRESS);
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
        session2.setStatus(Session.SessionStatus.IN_PROGRESS);
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
    @DisplayName("Should handle session status transitions correctly")
    void testSessionStatusTransitions() throws Exception {
        SessionDto sessionDto = SessionDto.builder()
                .userId("status-test-user")
                .questionIds(Arrays.asList("q1", "q2"))
                .startTime(LocalDateTime.now())
                .status(Session.SessionStatus.IN_PROGRESS)
                .totalQuestions(2)
                .correctAnswers(0)
                .incorrectAnswers(0)
                .unanswered(2)
                .answers(new HashMap<>())
                .timeSpentSeconds(0L)
                .examType(Session.ExamType.MIXED)
                .subject(Session.Subject.MIXED)
                .build();

        var result = mockMvc.perform(post("/sessions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(sessionDto)))
                .andExpect(status().isOk())
                .andReturn();

        String content = result.getResponse().getContentAsString();
        GenericResponse<SessionDto> response = objectMapper.readValue(content, 
                objectMapper.getTypeFactory().constructParametricType(GenericResponse.class, SessionDto.class));
        
        String sessionId = response.getData().getId().toString();

        SessionDto updateDto = SessionDto.builder()
                .id(response.getData().getId())
                .userId("status-test-user")
                .questionIds(Arrays.asList("q1", "q2"))
                .startTime(sessionDto.getStartTime())
                .endTime(LocalDateTime.now())
                .status(Session.SessionStatus.COMPLETED)
                .totalQuestions(2)
                .correctAnswers(1)
                .incorrectAnswers(1)
                .unanswered(0)
                .answers(Map.of(UUID.randomUUID(), "A", UUID.randomUUID(), "B"))
                .timeSpentSeconds(1200L)
                .examType(Session.ExamType.MIXED)
                .subject(Session.Subject.MIXED)
                .score(50.0)
                .build();

        mockMvc.perform(put("/sessions/{id}", sessionId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("COMPLETED")))
                .andExpect(jsonPath("$.data.score", is(50.0)))
                .andExpect(jsonPath("$.data.endTime", notNullValue()));
    }

    @Test
    @DisplayName("Should validate required fields")
    void testValidation() throws Exception {
        SessionDto invalidDto = new SessionDto();

        mockMvc.perform(post("/sessions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidDto)))
                .andExpect(status().isBadRequest());
    }
}