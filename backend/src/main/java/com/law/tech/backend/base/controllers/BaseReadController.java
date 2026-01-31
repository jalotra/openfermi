package com.law.tech.backend.base.controllers;

import com.law.tech.backend.base.models.dtos.BaseDto;
import com.law.tech.backend.base.models.BaseEntity;
import com.law.tech.backend.base.models.GenericResponse;
import com.law.tech.backend.base.repositories.BaseRepository;
import com.law.tech.backend.base.services.BaseReadService;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Slice;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.data.domain.Sort;

import jakarta.annotation.Nullable;
import jakarta.validation.Valid;

import java.util.List;

import static org.springframework.util.MimeTypeUtils.APPLICATION_JSON_VALUE;

public class BaseReadController<T extends BaseDto, E extends BaseEntity, R extends BaseRepository<E>> {

    BaseReadService<T, E, R> baseReadService;

    public BaseReadController(BaseReadService<T, E, R> baseReadService) {
        this.baseReadService = baseReadService;
    }
    
    @GetMapping(value = "", consumes = APPLICATION_JSON_VALUE)
    public ResponseEntity<GenericResponse<List<T>>> read(
            @Nullable @RequestParam String page, @Nullable @RequestParam String size) {
        if (page == null || size == null) {
            List<T> result = baseReadService.readAll();
            return ResponseEntity.ok(GenericResponse.<List<T>>builder()
                    .data(result)
                    .message("Success")
                    .build());
        } else {
            Page<T> result = baseReadService.readPage(Integer.parseInt(page), Integer.parseInt(size));
            return ResponseEntity.ok(GenericResponse.<List<T>>builder()
                    .data(result.getContent())
                    .message("Success")
                    .build());
        }
    }

    // this helps to get sorted data in chunks
    @GetMapping(value = "/sorted/slice", consumes = APPLICATION_JSON_VALUE)
    public ResponseEntity<GenericResponse<List<T>>> readWithSortingSlice(
            @Valid Sort.Direction direction,
            @Valid String sortBy,
            @Valid @RequestParam String page,
            @Valid @RequestParam String size) {
        Slice<T> result = baseReadService.readSliceWithSorting(Integer.parseInt(page), Integer.parseInt(size), direction, sortBy);
        return ResponseEntity.ok(GenericResponse.<List<T>>builder()
                .data(result.getContent())
                .message("Success")
                .build());
    }

    @GetMapping(value = "/sorted", consumes = APPLICATION_JSON_VALUE)
    public ResponseEntity<GenericResponse<List<T>>> readWithSorting(
            @Valid Sort.Direction direction,
            @Valid String sortBy,
            @Valid @RequestParam String page,
            @Valid @RequestParam String size) {
        Page<T> result =
                baseReadService.readPageWithSorting(
                        Integer.parseInt(page), Integer.parseInt(size), Sort.by(direction, sortBy));
        return ResponseEntity.ok(
                GenericResponse.<List<T>>builder()
                        .data(result.getContent())
                        .message("Success")
                        .build());
    }

    @GetMapping(value = "/count", consumes = APPLICATION_JSON_VALUE)
    public ResponseEntity<GenericResponse<Long>> count() {
        Long result = baseReadService.count();
        return ResponseEntity.ok(
                GenericResponse.<Long>builder().data(result).message("Success").build());
    }
}
