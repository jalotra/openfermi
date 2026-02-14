package com.law.tech.backend.learningsessions.controllers;

import com.law.tech.backend.base.controllers.BaseController;
import com.law.tech.backend.base.controllers.BaseReadController;
import com.law.tech.backend.base.models.GenericResponse;
import com.law.tech.backend.learningsessions.models.LearningSession;
import com.law.tech.backend.learningsessions.models.dtos.LearningSessionDto;
import com.law.tech.backend.learningsessions.repositories.LearningSessionRepository;
import com.law.tech.backend.learningsessions.services.crud.LearningSessionCrudService;
import com.law.tech.backend.learningsessions.services.crud.LearningSessionReadService;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/learning-sessions")
public class LearningSessionController extends BaseController<LearningSessionDto, LearningSession, LearningSessionRepository> {

    private final LearningSessionReadService learningSessionReadService;

    public LearningSessionController(LearningSessionCrudService crudService, LearningSessionReadService readService) {
        super(crudService);
        this.learningSessionReadService = readService;
    }

    @GetMapping("")
    public ResponseEntity<GenericResponse<List<LearningSessionDto>>> read(
            @RequestParam(required = false) String page,
            @RequestParam(required = false) String size) {
        BaseReadController<LearningSessionDto, LearningSession, LearningSessionRepository> readController =
            new BaseReadController<>(learningSessionReadService);
        return readController.read(page, size);
    }

    @GetMapping("/sorted")
    public ResponseEntity<GenericResponse<List<LearningSessionDto>>> readWithSorting(
            @RequestParam String direction,
            @RequestParam String sortBy,
            @RequestParam String page,
            @RequestParam String size) {
        BaseReadController<LearningSessionDto, LearningSession, LearningSessionRepository> readController =
            new BaseReadController<>(learningSessionReadService);
        return readController.readWithSorting(
            Sort.Direction.valueOf(direction.toUpperCase()),
            sortBy,
            page,
            size
        );
    }

    @GetMapping("/count")
    public ResponseEntity<GenericResponse<Long>> count() {
        BaseReadController<LearningSessionDto, LearningSession, LearningSessionRepository> readController =
            new BaseReadController<>(learningSessionReadService);
        return readController.count();
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<GenericResponse<List<LearningSessionDto>>> getByUserId(@PathVariable String userId) {
        List<LearningSessionDto> sessions = learningSessionReadService.findByUserId(userId);
        return ResponseEntity.ok(
                GenericResponse.<List<LearningSessionDto>>builder().data(sessions).message("Success").build()
        );
    }

    @GetMapping("/question/{questionId}/tutor/{tutorId}")
    public ResponseEntity<GenericResponse<LearningSessionDto>> getByQuestionAndTutor(
            @PathVariable UUID questionId, @PathVariable UUID tutorId) {
        Optional<LearningSessionDto> session = learningSessionReadService.findByQuestionIdAndTutorId(questionId, tutorId);
        return session.map(dto -> ResponseEntity.ok(
                GenericResponse.<LearningSessionDto>builder().data(dto).message("Success").build()
        )).orElseGet(() -> ResponseEntity.status(404).body(
                GenericResponse.<LearningSessionDto>builder().data(null).message("Learning session not found").build()
        ));
    }
}
