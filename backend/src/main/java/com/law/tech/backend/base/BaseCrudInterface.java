package com.law.tech.backend.base;

import java.util.UUID;

import com.law.tech.backend.base.models.dtos.BaseDto;

public interface BaseCrudInterface<D extends BaseDto> {
    public D upsert(D dto);
    public void delete(UUID id);
    public D read(UUID id);
}
