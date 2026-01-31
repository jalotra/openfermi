package com.law.tech.backend.base.exceptions;

public class EntityNotFoundException extends AbstractBaseException {
    public EntityNotFoundException(IErrorCode errorCode, Throwable cause) {
        super(errorCode, cause);
    }

    public EntityNotFoundException(IErrorCode errorCode) {
        this(errorCode, null);
    }
}
