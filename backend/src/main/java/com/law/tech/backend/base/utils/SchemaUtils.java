package com.law.tech.backend.base.utils;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.law.tech.backend.base.models.StructuredOutput;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.converter.BeanOutputConverter;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class SchemaUtils {
    public static JsonNode getFieldDefinitions(Class<?> entityClass) {
        if (entityClass.isAnnotationPresent(StructuredOutput.class)) {
            BeanOutputConverter<?> converter = new BeanOutputConverter<>(entityClass);
            ObjectNode jsonNode = JsonNodeFactory.instance.objectNode();
            jsonNode.put("llm_prompt", converter.getFormat());
            jsonNode.put("llm_schema", converter.getJsonSchema());
            return jsonNode;
        } else {
            throw new IllegalArgumentException("Entity class is not annotated with StructuredOutput");
        }
    }
}
