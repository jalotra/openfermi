package com.law.tech.backend.questions.controllers;

import com.law.tech.backend.base.BaseController;
import com.law.tech.backend.base.BaseReadController;
import com.law.tech.backend.base.models.GenericResponse;
import com.law.tech.backend.questions.models.Question;
import com.law.tech.backend.questions.models.dtos.QuestionDto;
import com.law.tech.backend.questions.repositories.QuestionRepository;
import com.law.tech.backend.questions.services.crud.QuestionCrudService;
import com.law.tech.backend.questions.services.crud.QuestionReadService;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/questions")
public class QuestionController extends BaseController<QuestionDto, Question, QuestionRepository> {
    
    private final QuestionReadService questionReadService;

    public QuestionController(QuestionCrudService questionCrudService, QuestionReadService questionReadService) {
        super(questionCrudService);
        this.questionReadService = questionReadService;
    }

    @GetMapping("")
    public ResponseEntity<GenericResponse<List<QuestionDto>>> read(
            @RequestParam(required = false) String page,
            @RequestParam(required = false) String size) {
        BaseReadController<QuestionDto, Question, QuestionRepository> readController = 
            new BaseReadController<>(questionReadService);
        return readController.read(page, size);
    }

    @GetMapping("/sorted")
    public ResponseEntity<GenericResponse<List<QuestionDto>>> readWithSorting(
            @RequestParam String direction,
            @RequestParam String sortBy,
            @RequestParam String page,
            @RequestParam String size) {
        BaseReadController<QuestionDto, Question, QuestionRepository> readController = 
            new BaseReadController<>(questionReadService);
        return readController.readWithSorting(
            Sort.Direction.valueOf(direction.toUpperCase()),
            sortBy,
            page,
            size
        );
    }

    @GetMapping("/count")
    public ResponseEntity<GenericResponse<Long>> count() {
        BaseReadController<QuestionDto, Question, QuestionRepository> readController = 
            new BaseReadController<>(questionReadService);
        return readController.count();
    }
}
