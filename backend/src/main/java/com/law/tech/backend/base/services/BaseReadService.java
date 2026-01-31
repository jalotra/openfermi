package com.law.tech.backend.base.services;

import com.law.tech.backend.base.models.dtos.BaseDto;
import com.law.tech.backend.base.models.BaseEntity;
import com.law.tech.backend.base.mappers.BaseMapper;
import com.law.tech.backend.base.repositories.BaseRepository;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.Sort;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

@FieldDefaults(level = AccessLevel.PRIVATE)
public class BaseReadService<T extends BaseDto, E extends BaseEntity, R extends BaseRepository<E>>
        implements com.law.tech.backend.base.BaseReadInterface<T> {
    protected final R repository;
    protected final BaseMapper<T, E> mapper;

    public BaseReadService(R repository, BaseMapper<T, E> mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    public List<T> readAll() {
        return StreamSupport.stream(repository.findAll().spliterator(), false)
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public Page<T> readPage(int page, int size) {
        return repository.findAll(PageRequest.of(page, size)).map(mapper::toDto);
    }

    @Override
    public Long count() {
        return repository.count();
    }

    @Override
    public Page<T> readPageWithSorting(int page, int size, Sort sort) {
        return repository.findAll(
                PageRequest.of(page, size)
        ).map(mapper::toDto);
    }

    @Override
    public Page<T> readPageWithSortingAndDirection(int page, int size, String sortBy, Sort.Direction direction) {
        return this.readPageWithSorting(
                page, size, Sort.by(direction, sortBy)
        );
    }

    // these would give out performance boost while doing paging operations
    // as slice doesnt care about COUNT(*) query
    @Override
    @Transactional(readOnly = true)
    public Slice<T> readSliceWithSorting(int page, int size, Sort.Direction direction, String sortBy) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
        return repository.findAllBy(pageable).map(mapper::toDto);
    }

}
