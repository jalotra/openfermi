package com.law.tech.backend.sessions.repositories;

import com.law.tech.backend.base.statemachine.StatefulRepository;
import com.law.tech.backend.sessions.models.Session;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SessionRepository extends StatefulRepository<Session> {
    List<Session> findByUserId(String userId);
    List<Session> findByUserIdAndState(String userId, String state);
    List<Session> findByExamType(Session.ExamType examType);
    List<Session> findBySubject(Session.Subject subject);
}
