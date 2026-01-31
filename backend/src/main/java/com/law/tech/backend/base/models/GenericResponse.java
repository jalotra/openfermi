package com.law.tech.backend.base.models;

import lombok.Data;
import lombok.experimental.SuperBuilder;

@SuperBuilder
@Data
public class GenericResponse<T> {
    private T data;
    private String message;
}
