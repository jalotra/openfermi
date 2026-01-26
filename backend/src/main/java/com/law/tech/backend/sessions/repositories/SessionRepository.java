package com.law.tech.backend.sessions.repositories;

import com.law.tech.backend.base.BaseRepository;
import com.law.tech.backend.sessions.models.Session;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SessionRepository extends BaseRepository<Session> {
    List<Session> findByUserId(String userId);
    List<Session> findByUserIdAndStatus(String userId, Session.SessionStatus status);
    List<Session> findByStatus(Session.SessionStatus status);
    List<Session> findByExamType(Session.ExamType examType);
    List<Session> findBySubject(Session.Subject subject);
}
