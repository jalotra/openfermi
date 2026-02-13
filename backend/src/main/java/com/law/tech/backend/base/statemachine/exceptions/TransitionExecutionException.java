package com.law.tech.backend.base.statemachine.exceptions;

import org.springframework.http.HttpStatus;

public class TransitionExecutionException extends AbstractTransitionException {

    private final String phase;

    public TransitionExecutionException(String phase, Throwable cause) {
        super(TransitionErrorCode.TRANSITION_EXECUTION_FAILED, HttpStatus.INTERNAL_SERVER_ERROR, cause);
        this.phase = phase;
    }

    public String getPhase() {
        return phase;
    }

    @Override
    public String getMessage() {
        return "Transition hook failed during '" + phase + "' phase: " + getCause().getMessage();
    }
}
