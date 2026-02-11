package com.law.tech.backend.base.statemachine;

import com.law.tech.backend.base.mappers.BaseMapper;
import com.law.tech.backend.base.services.BaseCrudService;
import com.law.tech.backend.base.statemachine.exceptions.InvalidStateException;
import com.law.tech.backend.base.statemachine.exceptions.InvalidTransitionException;
import com.law.tech.backend.base.statemachine.exceptions.StateMachineException;
import com.law.tech.backend.base.statemachine.exceptions.TransitionDeniedException;
import com.law.tech.backend.base.statemachine.exceptions.TransitionExecutionException;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.statemachine.StateMachine;
import org.springframework.statemachine.StateMachineEventResult;
import org.springframework.statemachine.support.DefaultStateMachineContext;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Mono;

public abstract class StatefulCrudService<
                T extends StatefulDto,
                E extends StatefulEntity,
                R extends StatefulRepository<E>,
                S extends Enum<S>,
                V extends Enum<V>>
        extends BaseCrudService<T, E, R> {

    private final LifecycleConfig<S, V> lifecycleConfig;
    private final StateMachineConfigRegistrar registrar;
    private final TransitionHandler<E, S, V> transitionHandler;

    protected StatefulCrudService(
            R repository,
            BaseMapper<T, E> mapper,
            LifecycleConfig<S, V> lifecycleConfig,
            StateMachineConfigRegistrar registrar,
            TransitionHandler<E, S, V> transitionHandler) {
        super(repository, mapper);
        this.lifecycleConfig = lifecycleConfig;
        this.registrar = registrar;
        this.transitionHandler = transitionHandler;
    }

    @Override
    public T upsert(T dto) {
        if (dto.getId() == null && (dto.getState() == null || dto.getState().isBlank())) {
            dto.setState(lifecycleConfig.getInitialState().name());
        }
        return super.upsert(dto);
    }

    @Transactional
    public T transition(UUID entityId, V event) {
        E entity = repository.findById(entityId).orElseThrow(() -> new RuntimeException("Entity not found with id " + entityId));

        S currentState = resolveState(entity.getState());
        TransitionContext<E, S, V> beforeCtx = new TransitionContext<>(entity, event, currentState, null);

        runHooks(transitionHandler.beforeTransition(event), beforeCtx, "beforeTransition");

        StateMachine<S, V> machine = acquireAndRestore(currentState);

        try {
            List<StateMachineEventResult<S, V>> results = machine
                    .sendEvent(Mono.just(MessageBuilder.withPayload(event).build()))
                    .collectList()
                    .block();

            if (results == null || results.isEmpty()) {
                throw new InvalidTransitionException(currentState.name(), event.name());
            }

            boolean accepted = results.stream()
                    .anyMatch(r -> r.getResultType() == StateMachineEventResult.ResultType.ACCEPTED);

            if (!accepted) {
                throw new InvalidTransitionException(currentState.name(), event.name());
            }
        } catch (InvalidTransitionException e) {
            throw e;
        } catch (Exception e) {
            throw new StateMachineException("Failed to send event '" + event.name() + "'", e);
        }

        S newState = machine.getState().getId();

        TransitionContext<E, S, V> onCtx = new TransitionContext<>(entity, event, currentState, newState);
        runHooks(transitionHandler.onTransition(event), onCtx, "onTransition");

        entity.setPreviousState(entity.getState());
        entity.setState(newState.name());

        TransitionContext<E, S, V> afterCtx = new TransitionContext<>(entity, event, currentState, newState);
        runHooks(transitionHandler.afterTransition(event), afterCtx, "afterTransition");

        E saved = repository.save(entity);
        machine.stopReactively().block();

        return mapper.toDto(saved);
    }

    public List<V> getAvailableEvents(UUID entityId) {
        E entity = repository.findById(entityId).orElseThrow(() -> new RuntimeException("Entity not found with id " + entityId));

        S currentState = resolveState(entity.getState());
        StateMachine<S, V> machine = acquireAndRestore(currentState);

        try {
            return machine.getTransitions().stream()
                    .filter(t -> t.getSource().getId().equals(currentState))
                    .map(t -> t.getTrigger().getEvent())
                    .distinct()
                    .collect(Collectors.toList());
        } finally {
            machine.stopReactively().block();
        }
    }

    public String generateDebugDot(UUID entityId) {
        E entity = repository.findById(entityId)
                .orElseThrow(() -> new RuntimeException("Entity not found with id " + entityId));

        S currentState = resolveState(entity.getState());

        StateMachine<S, V> machine = acquireAndRestore(lifecycleConfig.getInitialState());

        try {
            StringBuilder dot = new StringBuilder();
            dot.append("digraph lifecycle {\n");
            dot.append("  rankdir=LR;\n");
            dot.append("  node [shape=rectangle, style=rounded];\n");

            for (org.springframework.statemachine.state.State<S, V> smState : machine.getStates()) {
                S stateId = smState.getId();
                if (stateId.equals(currentState)) {
                    dot.append("  ").append(stateId.name())
                            .append(" [peripheries=2, xlabel=\"current\"];\n");
                }
            }

            for (org.springframework.statemachine.transition.Transition<S, V> t : machine.getTransitions()) {
                if (t.getTrigger() == null || t.getTrigger().getEvent() == null) {
                    continue;
                }

                S source = t.getSource().getId();
                S target = t.getTarget().getId();
                V event = t.getTrigger().getEvent();

                List<String> beforeNames = transitionHandler.beforeTransitionNames(event);
                List<String> onNames = transitionHandler.onTransitionNames(event);
                List<String> afterNames = transitionHandler.afterTransitionNames(event);

                StringBuilder label = new StringBuilder(event.name());
                boolean hasHooks = !beforeNames.isEmpty() || !onNames.isEmpty() || !afterNames.isEmpty();
                if (hasHooks) {
                    label.append("\\n---");
                    if (!beforeNames.isEmpty()) {
                        label.append("\\nbefore: ").append(beforeNames);
                    }
                    if (!onNames.isEmpty()) {
                        label.append("\\non: ").append(onNames);
                    }
                    if (!afterNames.isEmpty()) {
                        label.append("\\nafter: ").append(afterNames);
                    }
                }

                dot.append("  ").append(source.name()).append(" -> ").append(target.name())
                        .append(" [label=\"").append(label).append("\"];\n");
            }

            dot.append("}\n");
            return dot.toString();
        } finally {
            machine.stopReactively().block();
        }
    }

    private S resolveState(String stateName) {
        try {
            return Enum.valueOf(lifecycleConfig.getStateType(), stateName);
        } catch (IllegalArgumentException e) {
            throw new InvalidStateException(lifecycleConfig.getStateType().getSimpleName(), stateName);
        }
    }

    private StateMachine<S, V> acquireAndRestore(S currentState) {
        StateMachine<S, V> machine = registrar.acquireMachine(lifecycleConfig);

        machine.getStateMachineAccessor().doWithAllRegions(access -> {
            access.resetStateMachineReactively(
                    new DefaultStateMachineContext<>(currentState, null, null, null)).block();
        });

        machine.startReactively().block();
        return machine;
    }

    private void runHooks(List<TransitionHook<E, S, V>> hooks, TransitionContext<E, S, V> ctx, String phase) {
        for (TransitionHook<E, S, V> hook : hooks) {
            try {
                hook.execute(ctx);
            } catch (TransitionDeniedException e) {
                throw e;
            } catch (Exception e) {
                throw new TransitionExecutionException(phase, e);
            }
        }
    }
}
