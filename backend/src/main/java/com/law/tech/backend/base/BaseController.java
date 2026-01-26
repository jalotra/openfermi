package com.law.tech.backend.base;

import com.fasterxml.jackson.databind.JsonNode;
import com.law.tech.backend.base.models.BaseDto;
import com.law.tech.backend.base.models.BaseEntity;
import com.law.tech.backend.base.models.GenericResponse;
import com.law.tech.backend.base.utils.SchemaUtils;
import jakarta.validation.Valid;
import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.util.UUID;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

public class BaseController<T extends BaseDto, E extends BaseEntity, R extends BaseRepository<E>> {
    protected BaseCrudService<T, E, R> baseCrudService;
    protected Class<R> dtoClass;

    public BaseController(BaseCrudService<T, E, R> baseCrudService) {
        this.baseCrudService = baseCrudService;
        Type genericSuperclass = getClass().getGenericSuperclass();
        if (genericSuperclass instanceof ParameterizedType) {
            ParameterizedType parameterizedType = (ParameterizedType) genericSuperclass;
            this.dtoClass = (Class<R>) parameterizedType.getActualTypeArguments()[1];
        }
    }

    @GetMapping(value = "/schema", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<GenericResponse<JsonNode>> getSchema() {
        return ResponseEntity.ok(GenericResponse.<JsonNode>builder()
                .data(SchemaUtils.getFieldDefinitions(dtoClass))
                .message("Success")
                .build());
    }

    @PostMapping(value = "", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<GenericResponse<T>> upsert(@RequestBody @Valid T dto) {
        T result = baseCrudService.upsert(dto);
        return ResponseEntity.ok(
                GenericResponse.<T>builder().data(result).message("Success").build());
    }

    @GetMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<GenericResponse<T>> get(@PathVariable UUID id) {
        T result = baseCrudService.read(id);
        return ResponseEntity.ok(
                GenericResponse.<T>builder().data(result).message("Success").build());
    }

    @DeleteMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<GenericResponse<T>> delete(@PathVariable UUID id) {
        baseCrudService.delete(id);
        return ResponseEntity.ok(
                GenericResponse.<T>builder().data(null).message("Success").build());
    }
}
