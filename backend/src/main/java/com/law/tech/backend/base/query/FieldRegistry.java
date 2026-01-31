package com.law.tech.backend.base.query;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

// this is singleton class to register fields for all entity types
public final class FieldRegistry {
    private static final FieldRegistry INSTANCE = new FieldRegistry();
    private final Map<EntityType, List<FieldDefinition>> fieldsByEntity;
    private final Map<EntityType, Map<String, FieldDefinition>> byNameByEntity;

    private FieldRegistry() {
        this.fieldsByEntity = new ConcurrentHashMap<>();
        this.byNameByEntity = new ConcurrentHashMap<>();
        for (EntityType entityType : EntityType.values()) {
            this.fieldsByEntity.put(entityType, new ArrayList<>());
            this.byNameByEntity.put(entityType, new ConcurrentHashMap<>());
        }
    }

    public static FieldRegistry getInstance() {
        return INSTANCE;
    }

    public synchronized void registerFields(EntityType entityType, List<FieldDefinition> fields) {
        if (fields == null || fields.isEmpty()) {
            return;
        }

        // Validate that all fields have the correct entity type
        for (FieldDefinition field : fields) {
            if (field.getEntityType() != entityType) {
                throw new IllegalArgumentException("Field '" + field.getName() + "' has entity type "
                        + field.getEntityType() + " but was registered for " + entityType);
            }
        }

        // Add to fields list
        List<FieldDefinition> currentFields = fieldsByEntity.get(entityType);
        currentFields.addAll(fields);

        // Update name lookup map
        Map<String, FieldDefinition> nameMap = byNameByEntity.get(entityType);
        for (FieldDefinition field : fields) {
            // Add canonical name
            nameMap.put(field.getName().toLowerCase(Locale.ROOT), field);

            // Add synonyms
            if (field.getSynonyms() != null) {
                for (String synonym : field.getSynonyms()) {
                    nameMap.put(synonym.toLowerCase(Locale.ROOT), field);
                }
            }
        }
    }

    public List<FieldDefinition> getFields(EntityType entityType) {
        return fieldsByEntity.get(entityType).stream().toList();
    }

    public Optional<FieldDefinition> resolve(EntityType entityType, String fieldName) {
        return Optional.ofNullable(byNameByEntity.get(entityType).get(fieldName.toLowerCase(Locale.ROOT)));
    }
}
