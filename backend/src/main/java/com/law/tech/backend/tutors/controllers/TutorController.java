package com.law.tech.backend.tutors.controllers;

import com.law.tech.backend.base.controllers.BaseController;
import com.law.tech.backend.base.controllers.BaseReadController;
import com.law.tech.backend.base.models.GenericResponse;
import com.law.tech.backend.tutors.models.Tutor;
import com.law.tech.backend.tutors.models.dtos.TutorDto;
import com.law.tech.backend.tutors.repositories.TutorRepository;
import com.law.tech.backend.tutors.services.crud.TutorCrudService;
import com.law.tech.backend.tutors.services.crud.TutorReadService;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tutors")
public class TutorController extends BaseController<TutorDto, Tutor, TutorRepository> {

    private final TutorReadService tutorReadService;

    public TutorController(TutorCrudService tutorCrudService, TutorReadService tutorReadService) {
        super(tutorCrudService);
        this.tutorReadService = tutorReadService;
    }

    @GetMapping("")
    public ResponseEntity<GenericResponse<List<TutorDto>>> read(
            @RequestParam(required = false) String page,
            @RequestParam(required = false) String size) {
        BaseReadController<TutorDto, Tutor, TutorRepository> readController =
            new BaseReadController<>(tutorReadService);
        return readController.read(page, size);
    }

    @GetMapping("/sorted")
    public ResponseEntity<GenericResponse<List<TutorDto>>> readWithSorting(
            @RequestParam String direction,
            @RequestParam String sortBy,
            @RequestParam String page,
            @RequestParam String size) {
        BaseReadController<TutorDto, Tutor, TutorRepository> readController =
            new BaseReadController<>(tutorReadService);
        return readController.readWithSorting(
            Sort.Direction.valueOf(direction.toUpperCase()),
            sortBy,
            page,
            size
        );
    }

    @GetMapping("/count")
    public ResponseEntity<GenericResponse<Long>> count() {
        BaseReadController<TutorDto, Tutor, TutorRepository> readController =
            new BaseReadController<>(tutorReadService);
        return readController.count();
    }

    @GetMapping("/active")
    public ResponseEntity<GenericResponse<List<TutorDto>>> getActiveTutors() {
        List<TutorDto> tutors = tutorReadService.findActive();
        return ResponseEntity.ok(
                GenericResponse.<List<TutorDto>>builder().data(tutors).message("Success").build()
        );
    }
}
