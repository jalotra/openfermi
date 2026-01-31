package com.law.tech.backend.sessions.services.crud;

import com.law.tech.backend.base.mappers.BaseMapper;
import com.law.tech.backend.base.services.BaseReadService;
import com.law.tech.backend.base.repositories.BaseRepository;
import com.law.tech.backend.sessions.models.Session;
import com.law.tech.backend.sessions.models.dtos.SessionDto;
import com.law.tech.backend.sessions.repositories.SessionRepository;
import org.springframework.stereotype.Service;

@Service
public class SessionReadService extends BaseReadService<SessionDto, Session, SessionRepository> {
    public SessionReadService(SessionRepository repository, BaseMapper<SessionDto, Session> mapper) {
        super(repository, mapper);
    }
}
