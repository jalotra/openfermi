package com.law.tech.backend.base.statemachine;

/**
 * @param toState null during the beforeTransition phase (state not yet determined)
 */
public record TransitionContext<T extends StatefulEntity, S extends Enum<S>, E extends Enum<E>>(
        T entity, E event, S fromState, S toState) {}
