package com.law.tech.backend.base.statemachine.exceptions;

import org.springframework.http.HttpStatus;

public class StateMachineException extends AbstractTransitionException {

    public StateMachineException(String message, Throwable cause) {
        super(TransitionErrorCode.STATE_MACHINE_ERROR, HttpStatus.INTERNAL_SERVER_ERROR, cause);
        this.detail = message;
    }

    private final String detail;

    @Override
    public String getMessage() {
        return "State machine error: " + detail;
    }
}
