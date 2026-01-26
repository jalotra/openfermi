package com.law.tech.backend.base;

import com.law.tech.backend.base.models.BaseEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.NoRepositoryBean;

import java.util.UUID;

@NoRepositoryBean
public interface BaseRepository<T extends BaseEntity> extends JpaRepository<T, UUID>{
    // Countless read (no COUNT(*))
    Slice<T> findAllBy(Pageable pageable);
}
    

