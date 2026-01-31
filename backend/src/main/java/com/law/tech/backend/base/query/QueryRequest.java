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
public class QueryRequest {
    private String q; // optional multi-field search text
    private List<SortSpec> sorts;
    private Integer page; // optional page number (0-based)
    private Integer size; // optional page size
    // Optional logical filter tree; if provided, overrides simple filters list.
    private FilterNode where;
}
