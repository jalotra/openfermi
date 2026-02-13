package com.law.tech.backend.base.statemachine.exceptions;

import com.law.tech.backend.base.exceptions.AbstractBaseException;
import com.law.tech.backend.base.exceptions.IErrorCode;
import org.springframework.http.HttpStatus;

public abstract class AbstractTransitionException extends AbstractBaseException {

    private final HttpStatus httpStatus;

    protected AbstractTransitionException(IErrorCode errorCode, HttpStatus httpStatus, Throwable cause) {
        super(errorCode, cause);
        this.httpStatus = httpStatus;
    }

    public HttpStatus getHttpStatus() {
        return httpStatus;
    }
}
