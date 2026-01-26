package com.law.tech.backend.base.models;

import lombok.Data;
import lombok.experimental.SuperBuilder;

import java.util.List;

@SuperBuilder
@Data
public class GenericListResponse<T> {
    private List<T> data;
    private String message;
}
