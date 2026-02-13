package com.law.tech.backend.base.statemachine;

import com.law.tech.backend.base.repositories.BaseRepository;
import java.util.List;
import org.springframework.data.repository.NoRepositoryBean;

@NoRepositoryBean
public interface StatefulRepository<E extends StatefulEntity> extends BaseRepository<E> {

    List<E> findByState(String state);
}
