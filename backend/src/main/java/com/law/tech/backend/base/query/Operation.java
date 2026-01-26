package com.law.tech.backend.base.query;

public enum Operation {
    EQUALS,
    NOT_EQUALS,
    CONTAINS,
    STARTS_WITH,
    ENDS_WITH,
    IN,
    // For DATE_STRING types (stored as text). Uses simple year matching.
    YEAR_EQUALS,
    YEAR_IN,
    YEAR_BETWEEN,
    YEAR_LESS_THAN,
    YEAR_GREATER_THAN,
    YEAR_LESS_THAN_OR_EQUAL,
    YEAR_GREATER_THAN_OR_EQUAL,
}
