package com.law.tech.backend.sessions.models;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Converter
public class SessionAnswerConverter implements AttributeConverter<Map<UUID, String>, String> {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String convertToDatabaseColumn(Map<UUID, String> attribute) {
        if (attribute == null || attribute.isEmpty()) {
            return null;
        }
        try {
            // Convert UUID keys to strings for JSON serialization
            Map<String, String> stringMap = new HashMap<>();
            for (Map.Entry<UUID, String> entry : attribute.entrySet()) {
                stringMap.put(entry.getKey().toString(), entry.getValue());
            }
            return objectMapper.writeValueAsString(stringMap);
        } catch (Exception e) {
            throw new RuntimeException("Error converting Map to JSON", e);
        }
    }

    @Override
    public Map<UUID, String> convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isEmpty()) {
            return new HashMap<>();
        }
        try {
            Map<String, String> stringMap = objectMapper.readValue(dbData, new TypeReference<Map<String, String>>() {});
            Map<UUID, String> uuidMap = new HashMap<>();
            for (Map.Entry<String, String> entry : stringMap.entrySet()) {
                uuidMap.put(UUID.fromString(entry.getKey()), entry.getValue());
            }
            return uuidMap;
        } catch (Exception e) {
            throw new RuntimeException("Error converting JSON to Map", e);
        }
    }
}
