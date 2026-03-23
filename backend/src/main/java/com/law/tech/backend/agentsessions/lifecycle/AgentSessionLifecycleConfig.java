package com.law.tech.backend.agentsessions.lifecycle;

import com.law.tech.backend.agentsessions.models.AgentSessionEvent;
import com.law.tech.backend.agentsessions.models.AgentSessionState;
import com.law.tech.backend.base.statemachine.LifecycleConfig;
import java.util.EnumSet;
import org.springframework.statemachine.config.builders.StateMachineStateConfigurer;
import org.springframework.statemachine.config.builders.StateMachineTransitionConfigurer;
import org.springframework.stereotype.Component;

@Component
public class AgentSessionLifecycleConfig implements LifecycleConfig<AgentSessionState, AgentSessionEvent> {

    @Override
    public Class<AgentSessionState> getStateType() {
        return AgentSessionState.class;
    }

    @Override
    public Class<AgentSessionEvent> getEventType() {
        return AgentSessionEvent.class;
    }

    @Override
    public AgentSessionState getInitialState() {
        return AgentSessionState.STARTING;
    }

    @Override
    public void configureStates(StateMachineStateConfigurer<AgentSessionState, AgentSessionEvent> states)
            throws Exception {
        states.withStates()
                .initial(AgentSessionState.STARTING)
                .end(AgentSessionState.COMPLETED)
                .end(AgentSessionState.FAILED)
                .end(AgentSessionState.TERMINATED)
                .states(EnumSet.allOf(AgentSessionState.class));
    }

    @Override
    public void configureTransitions(
            StateMachineTransitionConfigurer<AgentSessionState, AgentSessionEvent> transitions) throws Exception {
        transitions
                .withExternal()
                .source(AgentSessionState.STARTING)
                .target(AgentSessionState.RUNNING)
                .event(AgentSessionEvent.READY)
                .and()
                .withExternal()
                .source(AgentSessionState.STARTING)
                .target(AgentSessionState.FAILED)
                .event(AgentSessionEvent.FAIL)
                .and()
                .withExternal()
                .source(AgentSessionState.RUNNING)
                .target(AgentSessionState.COMPLETED)
                .event(AgentSessionEvent.COMPLETE)
                .and()
                .withExternal()
                .source(AgentSessionState.RUNNING)
                .target(AgentSessionState.TERMINATED)
                .event(AgentSessionEvent.TERMINATE)
                .and()
                .withExternal()
                .source(AgentSessionState.RUNNING)
                .target(AgentSessionState.FAILED)
                .event(AgentSessionEvent.FAIL);
    }
}
