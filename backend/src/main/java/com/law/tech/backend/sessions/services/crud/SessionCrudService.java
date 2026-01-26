package com.law.tech.backend.sessions.services.crud;

import com.law.tech.backend.base.BaseCrudService;
import com.law.tech.backend.base.BaseMapper;
import com.law.tech.backend.base.BaseRepository;
import com.law.tech.backend.sessions.models.Session;
import com.law.tech.backend.sessions.models.dtos.SessionDto;
import com.law.tech.backend.sessions.repositories.SessionRepository;
import org.springframework.stereotype.Service;

@Service
public class SessionCrudService extends BaseCrudService<SessionDto, Session, SessionRepository> {
    public SessionCrudService(SessionRepository repository, BaseMapper<SessionDto, Session> mapper) {
        super(repository, mapper);
    }
}
