package com.law.tech.backend.base.statemachine;

@FunctionalInterface
public interface TransitionHook<T extends StatefulEntity, S extends Enum<S>, E extends Enum<E>> {

    void execute(TransitionContext<T, S, E> context);
}
