package com.law.tech.backend.base.exceptions;

import lombok.Getter;

@Getter
public class RateLimitException extends AbstractBaseException {
    private final long retryAfterSeconds;

    public RateLimitException(IErrorCode errorCode, Throwable cause, long retryAfterSeconds) {
        super(errorCode, cause);
        this.retryAfterSeconds = retryAfterSeconds;
    }
}
