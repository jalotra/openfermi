package com.law.tech.backend.base.statemachine;

import org.springframework.statemachine.config.builders.StateMachineStateConfigurer;
import org.springframework.statemachine.config.builders.StateMachineTransitionConfigurer;

public interface LifecycleConfig<S extends Enum<S>, E extends Enum<E>> {

    Class<S> getStateType();

    Class<E> getEventType();

    S getInitialState();

    void configureStates(StateMachineStateConfigurer<S, E> states) throws Exception;

    void configureTransitions(StateMachineTransitionConfigurer<S, E> transitions) throws Exception;
}
