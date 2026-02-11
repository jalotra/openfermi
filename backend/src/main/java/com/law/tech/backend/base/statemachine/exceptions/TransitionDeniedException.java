package com.law.tech.backend.base.statemachine.exceptions;

import org.springframework.http.HttpStatus;

public class TransitionDeniedException extends AbstractTransitionException {

    public TransitionDeniedException(String reason) {
        super(TransitionErrorCode.TRANSITION_DENIED, HttpStatus.FORBIDDEN, null);
        this.reason = reason;
    }

    public TransitionDeniedException(String reason, Throwable cause) {
        super(TransitionErrorCode.TRANSITION_DENIED, HttpStatus.FORBIDDEN, cause);
        this.reason = reason;
    }

    private final String reason;

    public String getReason() {
        return reason;
    }

    @Override
    public String getMessage() {
        return "Transition denied: " + reason;
    }
}
