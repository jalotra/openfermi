package com.law.tech.backend.sessions.controllers;

import com.law.tech.backend.base.BaseController;
import com.law.tech.backend.base.BaseReadController;
import com.law.tech.backend.base.models.GenericResponse;
import com.law.tech.backend.sessions.models.Session;
import com.law.tech.backend.sessions.models.dtos.SessionDto;
import com.law.tech.backend.sessions.repositories.SessionRepository;
import com.law.tech.backend.sessions.services.crud.SessionCrudService;
import com.law.tech.backend.sessions.services.crud.SessionReadService;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/sessions")
public class SessionController extends BaseController<SessionDto, Session, SessionRepository> {
    
    private final SessionReadService sessionReadService;

    public SessionController(SessionCrudService sessionCrudService, SessionReadService sessionReadService) {
        super(sessionCrudService);
        this.sessionReadService = sessionReadService;
    }

    @GetMapping("")
    public ResponseEntity<GenericResponse<List<SessionDto>>> read(
            @RequestParam(required = false) String page,
            @RequestParam(required = false) String size) {
        BaseReadController<SessionDto, Session, SessionRepository> readController = 
            new BaseReadController<>(sessionReadService);
        return readController.read(page, size);
    }

    @GetMapping("/sorted")
    public ResponseEntity<GenericResponse<List<SessionDto>>> readWithSorting(
            @RequestParam String direction,
            @RequestParam String sortBy,
            @RequestParam String page,
            @RequestParam String size) {
        BaseReadController<SessionDto, Session, SessionRepository> readController = 
            new BaseReadController<>(sessionReadService);
        return readController.readWithSorting(
            Sort.Direction.valueOf(direction.toUpperCase()),
            sortBy,
            page,
            size
        );
    }

    @GetMapping("/count")
    public ResponseEntity<GenericResponse<Long>> count() {
        BaseReadController<SessionDto, Session, SessionRepository> readController = 
            new BaseReadController<>(sessionReadService);
        return readController.count();
    }
}
