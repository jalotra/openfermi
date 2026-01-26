package com.law.tech.backend.base.query;

/** Defines how field values should be retrieved for filters/dropdowns */
public enum ValueSourceType {
    /** Values should be fetched from database using distinct queries */
    DATABASE,

    /** Values should be retrieved from an enum class */
    ENUM
}
