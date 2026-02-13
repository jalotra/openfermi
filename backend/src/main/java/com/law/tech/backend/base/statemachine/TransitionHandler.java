package com.law.tech.backend.base.statemachine;

import java.util.List;

public interface TransitionHandler<T extends StatefulEntity, S extends Enum<S>, E extends Enum<E>> {

    default List<TransitionHook<T, S, E>> beforeTransition(E event) {
        return List.of();
    }

    default List<TransitionHook<T, S, E>> onTransition(E event) {
        return List.of();
    }

    default List<TransitionHook<T, S, E>> afterTransition(E event) {
        return List.of();
    }

    default List<String> beforeTransitionNames(E event) {
        return beforeTransition(event).stream()
                .map(h -> h.getClass().getSimpleName().isEmpty() ? h.toString() : h.getClass().getSimpleName())
                .toList();
    }

    default List<String> onTransitionNames(E event) {
        return onTransition(event).stream()
                .map(h -> h.getClass().getSimpleName().isEmpty() ? h.toString() : h.getClass().getSimpleName())
                .toList();
    }

    default List<String> afterTransitionNames(E event) {
        return afterTransition(event).stream()
                .map(h -> h.getClass().getSimpleName().isEmpty() ? h.toString() : h.getClass().getSimpleName())
                .toList();
    }
}
