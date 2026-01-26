package com.law.tech.backend.exceptions;

import lombok.Data;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
public abstract class IErrorCode {
    private final String code;
    private final String message;

    public IErrorCode(String code, String message) {
        this.code = code;
        this.message = message;
    }
}
