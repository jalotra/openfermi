package com.law.tech.backend.sessions.lifecycle;

import com.law.tech.backend.base.statemachine.LifecycleConfig;
import com.law.tech.backend.sessions.models.SessionEvent;
import com.law.tech.backend.sessions.models.SessionState;
import java.util.EnumSet;
import org.springframework.statemachine.config.builders.StateMachineStateConfigurer;
import org.springframework.statemachine.config.builders.StateMachineTransitionConfigurer;
import org.springframework.stereotype.Component;

@Component
public class SessionLifecycleConfig implements LifecycleConfig<SessionState, SessionEvent> {

    @Override
    public Class<SessionState> getStateType() {
        return SessionState.class;
    }

    @Override
    public Class<SessionEvent> getEventType() {
        return SessionEvent.class;
    }

    @Override
    public SessionState getInitialState() {
        return SessionState.DRAFT;
    }

    @Override
    public void configureStates(StateMachineStateConfigurer<SessionState, SessionEvent> states) throws Exception {
        states.withStates()
                .initial(SessionState.DRAFT)
                .end(SessionState.ENDED)
                .states(EnumSet.allOf(SessionState.class));
    }

    @Override
    public void configureTransitions(StateMachineTransitionConfigurer<SessionState, SessionEvent> transitions)
            throws Exception {
        transitions
                .withExternal()
                .source(SessionState.DRAFT)
                .target(SessionState.LIVE)
                .event(SessionEvent.START)
                .and()
                .withExternal()
                .source(SessionState.LIVE)
                .target(SessionState.PAUSED)
                .event(SessionEvent.PAUSE)
                .and()
                .withExternal()
                .source(SessionState.PAUSED)
                .target(SessionState.LIVE)
                .event(SessionEvent.RESUME)
                .and()
                .withExternal()
                .source(SessionState.LIVE)
                .target(SessionState.ENDED)
                .event(SessionEvent.END)
                .and()
                .withExternal()
                .source(SessionState.PAUSED)
                .target(SessionState.ENDED)
                .event(SessionEvent.END);
    }
}
