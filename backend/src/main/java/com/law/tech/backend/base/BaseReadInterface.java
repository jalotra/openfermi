package com.law.tech.backend.base;

import com.law.tech.backend.base.models.dtos.BaseDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.Sort;

import java.util.List;

public interface BaseReadInterface<D extends BaseDto> {
    public List<D> readAll();
    public Page<D> readPage(int page, int size);
    public Long count();
    public Page<D> readPageWithSorting(int page, int size, Sort sort);
    public Page<D> readPageWithSortingAndDirection(int page, int size, String sortBy, Sort.Direction direction);
    public Slice<D> readSliceWithSorting(int page, int size, Sort.Direction direction, String sortBy);
}
