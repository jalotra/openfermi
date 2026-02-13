package com.law.tech.backend.sessions.services.crud;

import com.law.tech.backend.base.mappers.BaseMapper;
import com.law.tech.backend.base.statemachine.StateMachineConfigRegistrar;
import com.law.tech.backend.base.statemachine.StatefulCrudService;
import com.law.tech.backend.sessions.lifecycle.SessionLifecycleConfig;
import com.law.tech.backend.sessions.lifecycle.SessionTransitionHandler;
import com.law.tech.backend.sessions.models.Session;
import com.law.tech.backend.sessions.models.SessionEvent;
import com.law.tech.backend.sessions.models.SessionState;
import com.law.tech.backend.sessions.models.dtos.SessionDto;
import com.law.tech.backend.sessions.repositories.SessionRepository;
import org.springframework.stereotype.Service;

@Service
public class SessionCrudService
        extends StatefulCrudService<SessionDto, Session, SessionRepository, SessionState, SessionEvent> {

    public SessionCrudService(
            SessionRepository repository,
            BaseMapper<SessionDto, Session> mapper,
            SessionLifecycleConfig lifecycleConfig,
            StateMachineConfigRegistrar registrar,
            SessionTransitionHandler transitionHandler) {
        super(repository, mapper, lifecycleConfig, registrar, transitionHandler);
    }
}
