package com.law.tech.backend.base;

import com.law.tech.backend.base.models.BaseDto;
import com.law.tech.backend.base.models.BaseEntity;
import java.lang.reflect.Field;
import java.util.Optional;
import java.util.UUID;

public class BaseCrudService<T extends BaseDto, E extends BaseEntity, R extends BaseRepository<E>>
        implements BaseCrudInterface<T> {
    public R repository;
    public BaseMapper<T, E> mapper;

    public BaseCrudService(R repository, BaseMapper<T, E> mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    public T upsert(T dto) {
        if (dto.getId() == null) {
            E entity = mapper.toEntity(dto);
            E savedEntity = repository.save(entity);
            dto.setId(savedEntity.getId());
        } else {
            Optional<E> entityOptional = repository.findById(dto.getId());
            if (entityOptional.isPresent()) {
                E entity = entityOptional.get();
                copyNonNullFields(entity, dto);
                E savedEntity = repository.save(entity);
                dto.setId(savedEntity.getId());
            } else {
                throw new RuntimeException("Entity not found with id " + dto.getId());
            }
        }
        return dto;
    }

    @Override
    public void delete(UUID id) {
        if (repository.existsById(id)) {
            repository.deleteById(id);
        } else {
            throw new RuntimeException("Entity not found with id " + id);
        }
    }

    @Override
    public T read(UUID id) {
        Optional<E> entityOptional = repository.findById(id);
        if (entityOptional.isPresent()) {
            return mapper.toDto(entityOptional.get());
        } else {
            throw new RuntimeException("Entity not found with id " + id);
        }
    }

    // uses reflection to copy non null fields from dto to entity
    // TODO : this should be it recursively for fields inside dtos that are also objects
    private void copyNonNullFields(E entity, T dto) {
        Class<?> dtoClass = dto.getClass();
        Class<?> entityClass = entity.getClass();

        while (dtoClass != null && dtoClass != Object.class) {
            for (Field dtoField : dtoClass.getDeclaredFields()) {
                dtoField.setAccessible(true);
                try {
                    Object value = dtoField.get(dto);
                    if (value != null) {
                        Field entityField = findField(entityClass, dtoField.getName());
                        if (entityField != null) {
                            entityField.setAccessible(true);
                            entityField.set(entity, value);
                        }
                    }
                } catch (IllegalAccessException e) {
                    throw new RuntimeException(e);
                }
            }
            dtoClass = dtoClass.getSuperclass();
        }
    }

    private Field findField(Class<?> clazz, String fieldName) {
        Class<?> current = clazz;
        while (current != null && current != Object.class) {
            try {
                return current.getDeclaredField(fieldName);
            } catch (NoSuchFieldException e) {
            }
            current = current.getSuperclass();
        }
        return null;
    }
}
