package com.law.tech.backend.solutions.controllers;

import com.law.tech.backend.base.controllers.BaseController;
import com.law.tech.backend.base.controllers.BaseReadController;
import com.law.tech.backend.base.models.GenericResponse;
import com.law.tech.backend.solutions.models.Solution;
import com.law.tech.backend.solutions.models.dtos.SolutionDto;
import com.law.tech.backend.solutions.repositories.SolutionRepository;
import com.law.tech.backend.solutions.services.crud.SolutionCrudService;
import com.law.tech.backend.solutions.services.crud.SolutionReadService;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/solutions")
public class SolutionController extends BaseController<SolutionDto, Solution, SolutionRepository> {

    private final SolutionReadService solutionReadService;

    public SolutionController(SolutionCrudService solutionCrudService, SolutionReadService solutionReadService) {
        super(solutionCrudService);
        this.solutionReadService = solutionReadService;
    }

    @GetMapping("")
    public ResponseEntity<GenericResponse<List<SolutionDto>>> read(
            @RequestParam(required = false) String page,
            @RequestParam(required = false) String size) {
        BaseReadController<SolutionDto, Solution, SolutionRepository> readController =
            new BaseReadController<>(solutionReadService);
        return readController.read(page, size);
    }

    @GetMapping("/sorted")
    public ResponseEntity<GenericResponse<List<SolutionDto>>> readWithSorting(
            @RequestParam String direction,
            @RequestParam String sortBy,
            @RequestParam String page,
            @RequestParam String size) {
        BaseReadController<SolutionDto, Solution, SolutionRepository> readController =
            new BaseReadController<>(solutionReadService);
        return readController.readWithSorting(
            Sort.Direction.valueOf(direction.toUpperCase()),
            sortBy,
            page,
            size
        );
    }

    @GetMapping("/count")
    public ResponseEntity<GenericResponse<Long>> count() {
        BaseReadController<SolutionDto, Solution, SolutionRepository> readController =
            new BaseReadController<>(solutionReadService);
        return readController.count();
    }

    @GetMapping("/question/{questionId}")
    public ResponseEntity<GenericResponse<SolutionDto>> getByQuestionId(@PathVariable UUID questionId) {
        Optional<SolutionDto> solution = solutionReadService.findByQuestionId(questionId);
        return solution.map(dto -> ResponseEntity.ok(
                GenericResponse.<SolutionDto>builder().data(dto).message("Success").build()
        )).orElseGet(() -> ResponseEntity.status(404).body(
                GenericResponse.<SolutionDto>builder().data(null).message("Solution not found for question").build()
        ));
    }
}
