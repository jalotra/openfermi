package com.law.tech.backend.base.query;

import com.law.tech.backend.base.models.BaseEntity;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Root;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Service responsible for retrieving field values for filters/dropdowns Supports both database queries and enum-based
 * values
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FieldValueProvider {

    private final EntityManager entityManager;

    /**
     * Get distinct values for a field from the specified entity
     *
     * @param entityClass The entity class
     * @param fieldDefinition The field definition
     * @return FieldDefinitionValue containing the field values
     */
    public <T extends BaseEntity> FieldDefinitionValue getFieldValues(
            Class<T> entityClass, FieldDefinition fieldDefinition) {

        try {
            List<String> values;

            switch (fieldDefinition.getValueSourceType()) {
                case DATABASE -> values = getDatabaseValues(entityClass, fieldDefinition);
                case ENUM -> values = getEnumValues(fieldDefinition);
                default -> {
                    log.warn(
                            "Unknown value source type: {} for field: {}",
                            fieldDefinition.getValueSourceType(),
                            fieldDefinition.getName());
                    values = Collections.emptyList();
                }
            }

            return FieldDefinitionValue.builder()
                    .name(fieldDefinition.getName())
                    .values(values)
                    .build();

        } catch (Exception e) {
            log.error(
                    "Error retrieving field values for field: {} in entity: {}",
                    fieldDefinition.getName(),
                    entityClass.getSimpleName(),
                    e);

            return FieldDefinitionValue.builder()
                    .name(fieldDefinition.getName())
                    .values(Collections.emptyList())
                    .build();
        }
    }

    /** Get distinct values from database using JPA criteria query */
    private <T extends BaseEntity> List<String> getDatabaseValues(
            Class<T> entityClass, FieldDefinition fieldDefinition) {

        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<String> query = cb.createQuery(String.class);
        Root<T> root = query.from(entityClass);

        // Handle different field types and store the select expression for consistent ordering
        jakarta.persistence.criteria.Expression<String> selectExpression;

        switch (fieldDefinition.getType()) {
            case STRING -> {
                selectExpression = root.get(fieldDefinition.getEntityPath());
                query.select(selectExpression)
                        .distinct(true)
                        .where(cb.isNotNull(root.get(fieldDefinition.getEntityPath())));
            }
            case INTEGER -> {
                selectExpression = cb.toString(root.get(fieldDefinition.getEntityPath()));
                query.select(selectExpression)
                        .distinct(true)
                        .where(cb.isNotNull(root.get(fieldDefinition.getEntityPath())));
            }
            case DATE_STRING -> {
                selectExpression = cb.toString(root.get(fieldDefinition.getEntityPath()));
                query.select(selectExpression)
                        .distinct(true)
                        .where(cb.isNotNull(root.get(fieldDefinition.getEntityPath())));
            }
            default -> {
                log.warn(
                        "Unsupported field type for database query: {} for field: {}",
                        fieldDefinition.getType(),
                        fieldDefinition.getName());
                return Collections.emptyList();
            }
        }

        // Order by the same expression we're selecting to avoid PostgreSQL DISTINCT + ORDER BY issues
        query.orderBy(cb.asc(selectExpression));

        TypedQuery<String> typedQuery = entityManager.createQuery(query);
        typedQuery.setMaxResults(1000); // Limit to prevent memory issues

        List<String> results = typedQuery.getResultList();

        // Filter out null and empty values
        return results.stream()
                .filter(value -> value != null && !value.trim().isEmpty())
                .collect(Collectors.toList());
    }

    /** Get values from enum class */
    private List<String> getEnumValues(FieldDefinition fieldDefinition) {
        Class<? extends Enum<?>> enumClass = fieldDefinition.getEnumClass();

        if (enumClass == null) {
            log.warn("Enum class not specified for ENUM value source field: {}", fieldDefinition.getName());
            return Collections.emptyList();
        }

        return Arrays.stream(enumClass.getEnumConstants()).map(k -> k.toString()).collect(Collectors.toList());
    }
}
