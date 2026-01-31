package com.law.tech.backend.base.mappers;

import java.util.List;

import com.law.tech.backend.base.models.dtos.BaseDto;
import com.law.tech.backend.base.models.BaseEntity;

public interface BaseMapper <T extends BaseDto, E extends BaseEntity>  {
    public T toDto(E entity);
    
    public E toEntity(T dto);

    public List<T> toDtoList(List<E> entities);

    public List<E> toEntityList(List<T> dtos);
}
