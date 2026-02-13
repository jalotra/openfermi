package com.law.tech.backend.base.statemachine.exceptions;

import org.springframework.http.HttpStatus;

public class InvalidStateException extends AbstractTransitionException {

    private final String persistedState;
    private final String entityType;

    public InvalidStateException(String entityType, String persistedState) {
        super(TransitionErrorCode.INVALID_STATE, HttpStatus.UNPROCESSABLE_ENTITY, null);
        this.entityType = entityType;
        this.persistedState = persistedState;
    }

    public String getPersistedState() {
        return persistedState;
    }

    public String getEntityType() {
        return entityType;
    }

    @Override
    public String getMessage() {
        return "Entity '" + entityType + "' has unknown state '" + persistedState + "'";
    }
}
