package com.law.tech.backend.base.query;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SortSpec {
    private String field; // Canonical or synonym field name
    private boolean ascending; // true for ASC, false for DESC
}
