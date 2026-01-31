package com.law.tech.backend.base.query;

import com.law.tech.backend.base.models.BaseEntity;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class SearchableFieldDetector {
    public <T extends BaseEntity> List<FieldDefinition> detectFields(Class<T> entityClass, EntityType entityType) {
        List<FieldDefinition> fieldDefinitions = new ArrayList<>();
        List<Field> allFields = getAllFields(entityClass);
        for (Field field : allFields) {
            SearchableField annotation = field.getAnnotation(SearchableField.class);
            if (annotation != null) {
                FieldDefinition fieldDef = createFieldDefinition(field, annotation, entityType);
                fieldDefinitions.add(fieldDef);
                log.debug("Detected searchable field: {} in entity: {}", field.getName(), entityClass.getSimpleName());
            }
        }
        log.info("Detected {} searchable fields in entity: {}", fieldDefinitions.size(), entityClass.getSimpleName());
        return fieldDefinitions;
    }

    private List<Field> getAllFields(Class<?> clazz) {
        List<Field> fields = new ArrayList<>();

        while (clazz != null && clazz != Object.class) {
            fields.addAll(Arrays.asList(clazz.getDeclaredFields()));
            clazz = clazz.getSuperclass();
        }

        return fields;
    }

    private FieldDefinition createFieldDefinition(Field field, SearchableField annotation, EntityType entityType) {
        String fieldName = field.getName();
        String displayName = annotation.displayName().isEmpty() ? fieldName : annotation.displayName();

        return FieldDefinition.builder()
                .entityType(entityType)
                .name(fieldName)
                .displayName(displayName)
                .entityPath(fieldName) // For simple fields, path equals name
                .type(annotation.type())
                .searchable(annotation.searchable())
                .filterable(annotation.filterable())
                .sortable(annotation.sortable())
                .valueSourceType(annotation.valueSource())
                .enumClass(annotation.enumClass() != SearchableField.DefaultEnum.class ? annotation.enumClass() : null)
                .synonyms(Arrays.asList(annotation.synonyms()))
                .build();
    }
}
