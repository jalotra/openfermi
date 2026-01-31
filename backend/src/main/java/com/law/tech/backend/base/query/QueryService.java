package com.law.tech.backend.base.query;

import com.law.tech.backend.base.models.BaseEntity;
import java.util.List;
import org.springframework.data.domain.Slice;

public interface QueryService<T extends BaseEntity> {
    Slice<T> query(QueryRequest request);

    List<FieldDefinition> getFilterableFields();

    FieldDefinitionValue getFieldDefinitionValues(String fieldName);
}
