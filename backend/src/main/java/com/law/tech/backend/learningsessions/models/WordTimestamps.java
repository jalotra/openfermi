package com.law.tech.backend.learningsessions.models;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WordTimestamps {
    private List<String> words;
    private List<BigDecimal> start;
    private List<BigDecimal> end;
}
