package com.law.tech.backend.learningsessions.converters;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.law.tech.backend.learningsessions.models.WordTimestamps;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class WordTimestampsConverter implements AttributeConverter<WordTimestamps, String> {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String convertToDatabaseColumn(WordTimestamps attribute) {
        if (attribute == null) return null;
        try {
            return objectMapper.writeValueAsString(attribute);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Failed to serialize WordTimestamps", e);
        }
    }

    @Override
    public WordTimestamps convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) return null;
        try {
            return objectMapper.readValue(dbData, WordTimestamps.class);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Failed to deserialize WordTimestamps", e);
        }
    }
}
