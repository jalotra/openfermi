package com.law.tech.backend.base.exceptions;

public abstract class AbstractBaseException extends RuntimeException {
    private final IErrorCode errorCode;

    public AbstractBaseException(IErrorCode errorCode, Throwable cause) {
        super(errorCode.getMessage(), cause);
        this.errorCode = errorCode;
    }
}
