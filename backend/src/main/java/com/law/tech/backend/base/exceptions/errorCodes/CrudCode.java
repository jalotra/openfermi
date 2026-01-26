package com.law.tech.backend.base.exceptions.errorCodes;

import com.law.tech.backend.base.exceptions.IErrorCode;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor(staticName = "of")
public class CrudCode implements IErrorCode {
    private final String code;
    private final String message;
}
