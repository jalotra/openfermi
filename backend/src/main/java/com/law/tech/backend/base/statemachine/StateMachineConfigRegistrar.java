package com.law.tech.backend.base.statemachine;

import com.law.tech.backend.base.statemachine.exceptions.StateMachineException;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.statemachine.StateMachine;
import org.springframework.statemachine.config.StateMachineBuilder;
import org.springframework.statemachine.config.StateMachineFactory;
import org.springframework.stereotype.Component;

@Component
public class StateMachineConfigRegistrar {

    private final ConcurrentHashMap<String, StateMachineFactory<?, ?>> factoryCache = new ConcurrentHashMap<>();

    @SuppressWarnings("unchecked")
    public <S extends Enum<S>, E extends Enum<E>> StateMachineFactory<S, E> getOrCreateFactory(
            LifecycleConfig<S, E> config) {
        String key = config.getStateType().getName() + ":" + config.getEventType().getName();
        return (StateMachineFactory<S, E>) factoryCache.computeIfAbsent(key, k -> buildFactory(config));
    }

    public <S extends Enum<S>, E extends Enum<E>> StateMachine<S, E> acquireMachine(LifecycleConfig<S, E> config) {
        StateMachineFactory<S, E> factory = getOrCreateFactory(config);
        return factory.getStateMachine();
    }

    private <S extends Enum<S>, E extends Enum<E>> StateMachineFactory<S, E> buildFactory(
            LifecycleConfig<S, E> config) {
        try {
            StateMachineBuilder.Builder<S, E> builder = StateMachineBuilder.builder();
            config.configureStates(builder.configureStates());
            config.configureTransitions(builder.configureTransitions());
            return builder.createFactory();
        } catch (Exception e) {
            throw new StateMachineException(
                    "Failed to build StateMachineFactory for " + config.getStateType().getSimpleName(), e);
        }
    }
}
