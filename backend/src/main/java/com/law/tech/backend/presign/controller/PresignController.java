package com.law.tech.backend.presign.controller;

import com.law.tech.backend.presign.dto.PresignUrlRequest;
import com.law.tech.backend.presign.dto.PresignUrlResponse;
import com.law.tech.backend.presign.exception.ErrorResponse;
import com.law.tech.backend.presign.exception.S3PresignException;
import com.law.tech.backend.presign.service.PresignService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/presign")
public class PresignController {
    private final PresignService presignService;

    public PresignController(PresignService presignService) {
        this.presignService = presignService;
    }

    @PostMapping
    public ResponseEntity<PresignUrlResponse> createPresignUrl(@Valid @RequestBody PresignUrlRequest req) {
        PresignUrlResponse resp = presignService.generateUrl(req);
        return ResponseEntity.ok(resp);
    }

    @ExceptionHandler(S3PresignException.class)
    public ResponseEntity<ErrorResponse> handleS3Error(S3PresignException ex) {
        ErrorResponse err = new ErrorResponse("S3_PRESIGN_ERROR", ex.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(err);
    }
}
