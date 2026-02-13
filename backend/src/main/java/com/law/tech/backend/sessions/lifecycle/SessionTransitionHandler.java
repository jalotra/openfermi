package com.law.tech.backend.sessions.lifecycle;

import com.law.tech.backend.base.statemachine.TransitionHandler;
import com.law.tech.backend.base.statemachine.TransitionHook;
import com.law.tech.backend.base.statemachine.exceptions.TransitionDeniedException;
import com.law.tech.backend.sessions.models.Session;
import com.law.tech.backend.sessions.models.SessionEvent;
import com.law.tech.backend.sessions.models.SessionState;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class SessionTransitionHandler implements TransitionHandler<Session, SessionState, SessionEvent> {

    @Override
    public List<TransitionHook<Session, SessionState, SessionEvent>> beforeTransition(SessionEvent event) {
        if (event == SessionEvent.START) {
            return List.of(validateHasQuestions());
        }
        return List.of();
    }

    @Override
    public List<TransitionHook<Session, SessionState, SessionEvent>> afterTransition(SessionEvent event) {
        return switch (event) {
            case START -> List.of(setStartTime());
            case END -> List.of(setEndTime(), calculateScore());
            default -> List.of();
        };
    }

    @Override
    public List<String> beforeTransitionNames(SessionEvent event) {
        if (event == SessionEvent.START) {
            return List.of("validateHasQuestions");
        }
        return List.of();
    }

    @Override
    public List<String> afterTransitionNames(SessionEvent event) {
        return switch (event) {
            case START -> List.of("setStartTime");
            case END -> List.of("setEndTime", "calculateScore");
            default -> List.of();
        };
    }

    private TransitionHook<Session, SessionState, SessionEvent> validateHasQuestions() {
        return ctx -> {
            Session session = ctx.entity();
            if (session.getQuestionIds() == null || session.getQuestionIds().isEmpty()) {
                throw new TransitionDeniedException("Session has no questions assigned");
            }
        };
    }

    private TransitionHook<Session, SessionState, SessionEvent> setStartTime() {
        return ctx -> ctx.entity().setStartTime(LocalDateTime.now());
    }

    private TransitionHook<Session, SessionState, SessionEvent> setEndTime() {
        return ctx -> ctx.entity().setEndTime(LocalDateTime.now());
    }

    private TransitionHook<Session, SessionState, SessionEvent> calculateScore() {
        return ctx -> {
            Session session = ctx.entity();
            if (session.getAnswers() == null || session.getTotalQuestions() == null) {
                return;
            }
            int answered = session.getAnswers().size();
            int total = session.getTotalQuestions();
            session.setUnanswered(total - answered);
        };
    }
}
