package com.law.tech.backend.base.query;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Filter {
    private String field; // Canonical or synonym field name
    private Operation op; // Operation on the field
    private List<String> values; // One or more values
    private boolean negated; // If true, NOT of this condition
}
