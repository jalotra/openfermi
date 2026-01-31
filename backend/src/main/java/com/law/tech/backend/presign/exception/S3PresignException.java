package com.law.tech.backend.presign.exception;

public class S3PresignException extends RuntimeException {
    public S3PresignException(String message, Throwable cause) {
        super(message, cause);
    }
}
