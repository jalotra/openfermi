package com.law.tech.backend.base.exceptions;

public class CrudException extends AbstractBaseException {
    public CrudException(IErrorCode errorCode, Throwable cause) {
        super(errorCode, cause);
    }
}
