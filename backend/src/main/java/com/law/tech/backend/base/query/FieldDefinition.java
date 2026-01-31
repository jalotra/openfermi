package com.law.tech.backend.base.query;

import java.util.List;
import lombok.Builder;
import lombok.Singular;
import lombok.Value;

@Value
@Builder
public class FieldDefinition {
    String name; // Canonical DSL field name
    String displayName; // Human-readable display name
    String entityPath; // JPA attribute path on entity
    FieldType type; // Data type
    boolean searchable; // Included in full-text 'q' searches
    boolean filterable; // Can be used for filtering
    boolean sortable; // Can be used for sorting
    EntityType entityType; // Which entity this field belongs to
    ValueSourceType valueSourceType; // How to get field values (DB or ENUM)
    Class<? extends Enum<?>> enumClass; // Enum class for ENUM value source

    @Singular("synonym")
    List<String> synonyms; // Alternative names LLM may use
}
