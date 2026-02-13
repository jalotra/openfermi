package com.law.tech.backend.base.statemachine.exceptions;

import org.springframework.http.HttpStatus;

public class InvalidTransitionException extends AbstractTransitionException {

    private final String currentState;
    private final String event;

    public InvalidTransitionException(String currentState, String event) {
        super(TransitionErrorCode.INVALID_TRANSITION, HttpStatus.CONFLICT, null);
        this.currentState = currentState;
        this.event = event;
    }

    public String getCurrentState() {
        return currentState;
    }

    public String getEvent() {
        return event;
    }

    @Override
    public String getMessage() {
        return "No valid transition from state '" + currentState + "' for event '" + event + "'";
    }
}
