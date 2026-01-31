# Backend Development Guidelines

## Architecture Overview

This is a **Spring Boot 3.5.0** application using **Java 21** (LTS) with a **layered, domain-driven architecture** built on a robust generic CRUD infrastructure.

### Tech Stack
- **Framework**: Spring Boot 3.5.0
- **Java**: 21 (LTS) - Virtual Threads, Pattern Matching, Records
- **Build**: Maven 3.8+
- **Architecture**: Layered with Generic Base Classes
- **ORM**: Spring Data JPA (Hibernate 6)
- **DTO Mapping**: MapStruct 1.6.3
- **Database**: PostgreSQL

### Design Philosophy

**DRY at Scale**: The codebase uses a sophisticated generic infrastructure where new domain modules require minimal boilerplate. Once you understand the base classes, adding new features is rapid and consistent.

## Generic CRUD Infrastructure

The `base` package provides reusable infrastructure for any entity:

### Base Classes Explained

| Class | Purpose | Key Features |
|-------|---------|--------------|
| `BaseEntity` | Abstract entity | UUID PK, audit fields (createdAt, updatedAt), soft delete |
| `BaseDto` | Abstract DTO | Common fields for all DTOs |
| `BaseController<T,E,R>` | Generic REST controller | Auto CRUD endpoints, pagination, sorting |
| `BaseCrudService<E,R>` | Generic write service | Create, update, delete with validation hooks |
| `BaseReadService<E,R>` | Generic read service | Find, filter, pagination |
| `BaseRepository<E>` | Generic repository | Extends JpaRepository, custom query methods |
| `BaseMapper<E,D>` | MapStruct base | Entity <-> DTO conversion |

### Type Parameters

```java
// Controller: <Dto, Entity, Repository>
public class QuestionController extends BaseController<QuestionDto, Question, QuestionRepository>

// Service: <Entity, Repository>
public class QuestionService extends BaseCrudService<Question, QuestionRepository>
```

## Package Structure

```
backend/src/main/java/com/law/tech/backend/
├── base/                      # Generic infrastructure (read-only templates)
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   ├── mappers/
│   ├── models/
│   ├── query/                 # Advanced filtering/pagination
│   ├── exceptions/            # Exception hierarchy
│   └── http/                  # External HTTP clients
├── questions/                 # Domain module: questions
├── sessions/                  # Domain module: practice sessions
├── presign/                   # AWS S3 presigned URLs
├── config/                    # Configuration classes
└── BackendApplication.java
```

**Domain-Driven Structure**: Each domain module follows the same pattern:
```
questions/
├── models/
│   ├── Question.java          # Entity
│   └── dtos/
│       ├── QuestionDto.java   # API DTO
│       └── QuestionCreateRequest.java  # Request DTO
├── repositories/
│   └── QuestionRepository.java
├── services/
│   └── crud/
│       └── QuestionService.java
├── controllers/
│   └── QuestionController.java
└── mapper/
    └── QuestionMapper.java
```

## Adding New Domain Module

Complete step-by-step guide for adding a new entity:

### Step 1: Entity

```java
// models/Exam.java
package com.law.tech.backend.exams.models;

import com.law.tech.backend.base.models.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "exams")
@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Exam extends BaseEntity {
    
    @Column(nullable = false)
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "total_marks")
    private Integer totalMarks;
    
    @Column(name = "duration_minutes")
    private Integer durationMinutes;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "exam_type")
    private ExamType examType;
    
    // Business logic methods (not getters/setters)
    public boolean isTimed() {
        return durationMinutes != null && durationMinutes > 0;
    }
}
```

**Entity Rules**:
- Always extend `BaseEntity`
- Use Lombok: `@Data`, `@SuperBuilder`, `@NoArgsConstructor`, `@AllArgsConstructor`
- Add `@EqualsAndHashCode(callSuper = true)`
- Use `columnDefinition = "TEXT"` for long strings
- Enums: Store as STRING, never ORDINAL
- No business logic in getters/setters - add separate methods

### Step 2: DTOs

```java
// models/dtos/ExamDto.java
package com.law.tech.backend.exams.models.dtos;

import com.law.tech.backend.base.models.BaseDto;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class ExamDto extends BaseDto {
    private String title;
    private String description;
    private Integer totalMarks;
    private Integer durationMinutes;
    private String examType;
    // Don't expose internal IDs, use UUID from BaseDto
}

// Request DTO (if needed)
@Data
@Builder
public class ExamCreateRequest {
    @NotBlank(message = "Title is required")
    private String title;
    
    private String description;
    
    @Min(1)
    private Integer totalMarks;
    
    @Min(1)
    private Integer durationMinutes;
}
```

### Step 3: Repository

```java
// repositories/ExamRepository.java
package com.law.tech.backend.exams.repositories;

import com.law.tech.backend.base.repositories.BaseRepository;
import com.law.tech.backend.exams.models.Exam;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExamRepository extends BaseRepository<Exam> {
    
    // Custom query methods - Spring Data generates implementation
    Optional<Exam> findByTitle(String title);
    
    List<Exam> findByExamTypeOrderByTitleAsc(ExamType type);
    
    // For complex queries, use @Query
    @Query("SELECT e FROM Exam e WHERE e.totalMarks > :minMarks")
    List<Exam> findHighValueExams(@Param("minMarks") Integer minMarks);
}
```

**Repository Rules**:
- Always extend `BaseRepository<Entity>` (which extends JpaRepository)
- Use derived query methods for simple queries
- Use `@Query` for complex JPQL
- Return `Optional` for single results
- Use List (not Collection) for multiple results

### Step 4: Mapper

```java
// mapper/ExamMapper.java
package com.law.tech.backend.exams.mapper;

import com.law.tech.backend.base.mappers.BaseMapper;
import com.law.tech.backend.exams.models.Exam;
import com.law.tech.backend.exams.models.dtos.ExamDto;
import org.mapstruct.*;

@Mapper(
    componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
    unmappedTargetPolicy = ReportingPolicy.IGNORE
)
public interface ExamMapper extends BaseMapper<Exam, ExamDto> {
    
    // Custom mapping methods (if auto-mapping fails)
    @Mapping(target = "examType", expression = "java(exam.getExamType().name())")
    ExamDto toDto(Exam exam);
    
    @Mapping(target = "examType", expression = "java(ExamType.valueOf(dto.getExamType()))")
    Exam toEntity(ExamDto dto);
}
```

**Mapper Rules**:
- Extend `BaseMapper<Entity, Dto>`
- Use `componentModel = "spring"`
- `nullValuePropertyMappingStrategy = IGNORE` for updates
- Define custom mappings for complex conversions (enums, nested objects)
- MapStruct generates implementation at compile time

### Step 5: Service

```java
// services/crud/ExamService.java
package com.law.tech.backend.exams.services.crud;

import com.law.tech.backend.base.services.BaseCrudService;
import com.law.tech.backend.exams.mapper.ExamMapper;
import com.law.tech.backend.exams.models.Exam;
import com.law.tech.backend.exams.models.dtos.ExamDto;
import com.law.tech.backend.exams.repositories.ExamRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ExamService extends BaseCrudService<Exam, ExamRepository> {
    
    private final ExamMapper mapper;
    
    public ExamService(ExamRepository repository, ExamMapper mapper) {
        super(repository);
        this.mapper = mapper;
    }
    
    @Override
    protected void validateBeforeSave(Exam entity) {
        // Validation logic before create/update
        if (entity.getTotalMarks() != null && entity.getTotalMarks() < 0) {
            throw new IllegalArgumentException("Total marks cannot be negative");
        }
    }
    
    @Override
    protected void validateBeforeDelete(Exam entity) {
        // Validation before delete
    }
    
    // Custom business methods
    public ExamDto publishExam(UUID examId) {
        Exam exam = findById(examId);
        // Business logic
        return mapper.toDto(save(exam));
    }
}
```

**Service Rules**:
- Extend `BaseCrudService<Entity, Repository>` for write operations
- Use `@Transactional` at class level
- Constructor injection (never field injection with `@Autowired`)
- Override validation hooks for business rules
- Keep business logic in service, not controller
- Return DTOs from public methods, entities only internally

### Step 6: Controller

```java
// controllers/ExamController.java
package com.law.tech.backend.exams.controllers;

import com.law.tech.backend.base.controllers.BaseController;
import com.law.tech.backend.exams.mapper.ExamMapper;
import com.law.tech.backend.exams.models.Exam;
import com.law.tech.backend.exams.models.dtos.ExamDto;
import com.law.tech.backend.exams.repositories.ExamRepository;
import com.law.tech.backend.exams.services.crud.ExamService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/exams")
public class ExamController extends BaseController<ExamDto, Exam, ExamRepository> {
    
    private final ExamService service;
    private final ExamMapper mapper;
    
    public ExamController(ExamService service, ExamMapper mapper) {
        super(service, mapper);
        this.service = service;
        this.mapper = mapper;
    }
    
    // BaseController provides: GET /, GET /{id}, POST, PUT, DELETE
    // Add custom endpoints for specific operations:
    
    @PostMapping("/{id}/publish")
    public ExamDto publish(@PathVariable UUID id) {
        return service.publishExam(id);
    }
}
```

**Controller Rules**:
- Extend `BaseController<Dto, Entity, Repository>`
- Constructor injection
- Keep thin - delegate to service
- Use method-level annotations for custom endpoints
- BaseController provides standard CRUD

## Best Practices (Senior Java Dev Wisdom)

### 1. Immutability & Design

**Prefer Immutability Where Possible**
```java
// Good: Final fields, no setters needed after construction
@Value
@Builder
public class ExamConfig {
    private final int passingScore;
    private final Duration timeLimit;
    private final List<SectionConfig> sections; // UnmodifiableList
}

// For entities, balance with JPA requirements
```

**Use Records for DTOs (When Appropriate)**
```java
// Simple DTOs can be records
public record ExamSummary(UUID id, String title, int questionCount) {}

// Complex DTOs with builders still use classes
```

### 2. Dependency Injection

**Constructor Injection Only**
```java
@Service
public class ExamService {
    private final ExamRepository repository;
    private final ExamMapper mapper;
    private final NotificationService notificationService;
    
    // GOOD: All dependencies visible, testable, immutable
    public ExamService(ExamRepository repository, 
                       ExamMapper mapper,
                       NotificationService notificationService) {
        this.repository = repository;
        this.mapper = mapper;
        this.notificationService = notificationService;
    }
}

// NEVER use field injection with @Autowired
```

### 3. Transaction Boundaries

**Keep Transactions Short**
```java
@Service
@Transactional(readOnly = true)  // Default to read-only
public class ExamService {
    
    @Transactional  // Override for write operations
    public ExamDto create(ExamCreateRequest request) {
        // All in one transaction
        Exam exam = mapper.toEntity(request);
        validate(exam);
        Exam saved = repository.save(exam);
        notificationService.notifyCreated(saved);  // After save
        return mapper.toDto(saved);
    }
    
    // Read-only operations don't need @Transactional override
    public Optional<ExamDto> findById(UUID id) {
        return repository.findById(id).map(mapper::toDto);
    }
}
```

### 4. DTO Pattern Strictness

**Never Expose Entities in API**
```java
// BAD: Exposes internal entity
@GetMapping("/{id}")
public Exam getExam(@PathVariable UUID id) {  // Never return entity
    return repository.findById(id).orElseThrow();
}

// GOOD: Transform to DTO
@GetMapping("/{id}")
public ExamDto getExam(@PathVariable UUID id) {
    return service.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Exam", id));
}
```

**Use Different DTOs for Different Operations**
```java
// Create Request (subset of fields)
public record ExamCreateRequest(
    @NotBlank String title,
    String description
) {}

// Update Request (different validation)
public record ExamUpdateRequest(
    @NotBlank String title,
    String description,
    @Min(1) Integer duration
) {}

// Response DTO (includes computed fields)
public class ExamResponse {
    private UUID id;
    private String title;
    private String status;  // Computed
    private Instant createdAt;
}
```

### 5. MapStruct Mappings

**Simple Mappings Auto-Derived**
```java
@Mapper(componentModel = "spring")
public interface ExamMapper extends BaseMapper<Exam, ExamDto> {
    // Same field names = auto-mapped, no code needed
}
```

**Custom Mappings for Complex Cases**
```java
@Mapper(componentModel = "spring")
public interface ExamMapper {
    
    @Mapping(target = "id", source = "uuid")
    @Mapping(target = "status", expression = "java(determineStatus(exam))")
    @Mapping(target = "questionCount", source = "questions", qualifiedByName = "countQuestions")
    ExamDto toDto(Exam exam);
    
    @Named("countQuestions")
    default int countQuestions(List<Question> questions) {
        return questions != null ? questions.size() : 0;
    }
    
    default String determineStatus(Exam exam) {
        if (exam.isPublished()) return "PUBLISHED";
        if (exam.isDraft()) return "DRAFT";
        return "ARCHIVED";
    }
}
```

### 6. Exception Handling

**Use Custom Exception Hierarchy**
```java
// Base exception
public abstract class BusinessException extends RuntimeException {
    private final String errorCode;
    private final HttpStatus status;
    
    protected BusinessException(String message, String errorCode, HttpStatus status) {
        super(message);
        this.errorCode = errorCode;
        this.status = status;
    }
}

// Specific exceptions
public class ResourceNotFoundException extends BusinessException {
    public ResourceNotFoundException(String resource, UUID id) {
        super(
            String.format("%s with id %s not found", resource, id),
            "RESOURCE_NOT_FOUND",
            HttpStatus.NOT_FOUND
        );
    }
}

public class ValidationException extends BusinessException {
    public ValidationException(String message) {
        super(message, "VALIDATION_ERROR", HttpStatus.BAD_REQUEST);
    }
}
```

**Global Exception Handler**
```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusiness(BusinessException ex) {
        return ResponseEntity
            .status(ex.getStatus())
            .body(new ErrorResponse(ex.getErrorCode(), ex.getMessage()));
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        List<String> errors = ex.getBindingResult().getFieldErrors().stream()
            .map(e -> e.getField() + ": " + e.getDefaultMessage())
            .toList();
        
        return ResponseEntity
            .badRequest()
            .body(new ErrorResponse("VALIDATION_FAILED", errors));
    }
}
```

### 7. Repository Patterns

**Use Derived Query Methods**
```java
public interface ExamRepository extends BaseRepository<Exam> {
    // Spring Data generates these automatically
    Optional<Exam> findByTitleIgnoreCase(String title);
    List<Exam> findByExamTypeAndPublishedTrueOrderByCreatedAtDesc(ExamType type);
    boolean existsByTitle(String title);
    long countByExamType(ExamType type);
}
```

**Custom Queries for Complex Cases**
```java
@Query("""
    SELECT e FROM Exam e 
    LEFT JOIN FETCH e.questions q 
    WHERE e.examType = :type 
    AND e.published = true
    AND e.startDate <= :now
    AND e.endDate >= :now
    """)
List<Exam> findActiveExamsByType(@Param("type") ExamType type, @Param("now") Instant now);

// Native query when needed
@Query(value = """
    SELECT * FROM exams e 
    WHERE e.metadata @> '{\"difficulty\": \"HARD\"}'::jsonb
    """, nativeQuery = true)
List<Exam> findHardExams();
```

### 8. Validation Patterns

**Bean Validation Annotations**
```java
public class ExamCreateRequest {
    @NotBlank(message = "Title is required")
    @Size(min = 3, max = 200, message = "Title must be 3-200 characters")
    private String title;
    
    @Min(value = 1, message = "Duration must be at least 1 minute")
    @Max(value = 300, message = "Duration cannot exceed 300 minutes")
    private Integer durationMinutes;
    
    @Pattern(regexp = "^[A-Z]{3}-\\d{4}$", message = "Invalid exam code format")
    private String examCode;
}
```

**Service-Level Validation**
```java
@Override
protected void validateBeforeSave(Exam entity) {
    // Cross-field validation
    if (entity.getEndDate() != null && entity.getStartDate() != null 
        && entity.getEndDate().isBefore(entity.getStartDate())) {
        throw new ValidationException("End date must be after start date");
    }
    
    // Business rule validation
    if (repository.existsByTitle(entity.getTitle())) {
        throw new DuplicateResourceException("Exam with this title already exists");
    }
}
```

### 9. Testing Approach

**Unit Tests with Mockito**
```java
@ExtendWith(MockitoExtension.class)
class ExamServiceTest {
    
    @Mock
    private ExamRepository repository;
    
    @Mock
    private ExamMapper mapper;
    
    @InjectMocks
    private ExamService service;
    
    @Test
    void shouldCreateExam() {
        // Given
        ExamCreateRequest request = new ExamCreateRequest("Test", "Description");
        Exam entity = Exam.builder().title("Test").build();
        Exam saved = Exam.builder().id(UUID.randomUUID()).title("Test").build();
        
        when(mapper.toEntity(request)).thenReturn(entity);
        when(repository.save(entity)).thenReturn(saved);
        when(mapper.toDto(saved)).thenReturn(new ExamDto());
        
        // When
        ExamDto result = service.create(request);
        
        // Then
        assertNotNull(result);
        verify(repository).save(entity);
    }
}
```

**Integration Tests**
```java
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ExamControllerIntegrationTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Autowired
    private ExamRepository repository;
    
    @Test
    void shouldReturnExam() throws Exception {
        // Setup
        Exam exam = repository.save(Exam.builder().title("Test").build());
        
        // Test
        mockMvc.perform(get("/api/exams/" + exam.getId()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.title").value("Test"));
    }
}
```

### 10. Java 21 Features

**Virtual Threads (When Stable)**
```java
@Service
public class AsyncExamProcessor {
    
    @Async  // Uses virtual threads with spring.threads.virtual.enabled=true
    public CompletableFuture<Void> processBulkExams(List<UUID> examIds) {
        // Runs on virtual thread
        examIds.parallelStream().forEach(this::processExam);
        return CompletableFuture.completedFuture(null);
    }
}
```

**Pattern Matching**
```java
// Switch expressions
public String describe(ExamType type) {
    return switch (type) {
        case JEE_MAINS -> "JEE Mains Examination";
        case JEE_ADVANCED -> "JEE Advanced Examination";
        case NEET -> "NEET Medical Entrance";
        case null -> "Unknown";
    };
}

// Pattern matching for instanceof
if (dto instanceof ExamCreateRequest(var title, var desc)) {
    log.info("Creating exam: {}", title);
}
```

**Records for Simple Data**
```java
// Immutable data carriers
public record PaginationRequest(
    @Min(0) int page,
    @Min(1) @Max(100) int size,
    SortDirection direction,
    String sortBy
) {
    public PaginationRequest {
        // Compact constructor for validation
        if (sortBy == null || sortBy.isBlank()) {
            sortBy = "createdAt";
        }
    }
}
```

## Configuration & Dependencies

### Key Dependencies

```xml
<!-- Core -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>

<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>

<!-- DTO Mapping -->
<dependency>
    <groupId>org.mapstruct</groupId>
    <artifactId>mapstruct</artifactId>
    <version>1.6.3</version>
</dependency>

<!-- Boilerplate Reduction -->
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <optional>true</optional>
</dependency>

<!-- API Documentation -->
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.8.0</version>
</dependency>

<!-- External HTTP Clients -->
<dependency>
    <groupId>com.squareup.retrofit2</groupId>
    <artifactId>retrofit</artifactId>
    <version>2.11.0</version>
</dependency>

<!-- Background Jobs -->
<dependency>
    <groupId>org.jobrunr</groupId>
    <artifactId>jobrunr-spring-boot-3-starter</artifactId>
    <version>7.4.1</version>
</dependency>

<!-- AI/LLM Integration -->
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-openai-spring-boot-starter</artifactId>
    <version>1.0.0-M6</version>
</dependency>
```

### Build Configuration

```xml
<!-- Annotation processors -->
<annotationProcessorPaths>
    <path>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <version>${lombok.version}</version>
    </path>
    <path>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok-mapstruct-binding</artifactId>
        <version>0.2.0</version>
    </path>
    <path>
        <groupId>org.mapstruct</groupId>
        <artifactId>mapstruct-processor</artifactId>
        <version>${mapstruct.version}</version>
    </path>
</annotationProcessorPaths>

<!-- Code formatting -->
<plugin>
    <groupId>com.diffplug.spotless</groupId>
    <artifactId>spotless-maven-plugin</artifactId>
    <version>2.44.0.BETA1</version>
    <configuration>
        <java>
            <palantirJavaFormat/>
        </java>
    </configuration>
</plugin>
```

## Common Commands

```bash
# Build
./mvnw clean install

# Run
./mvnw spring-boot:run

# Run with profile
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev

# Format code
./mvnw spotless:apply

# Check formatting
./mvnw spotless:check

# Generate OpenAPI docs (access at /api/v3/api-docs)
# Available when app is running

# Database migrations
./mvnw flyway:migrate

# Run tests
./mvnw test

# Run single test
./mvnw test -Dtest=ExamServiceTest
```

## Summary

This architecture prioritizes:
- **Consistency**: Every domain module follows identical structure
- **Minimal Boilerplate**: Generic base classes handle 80% of CRUD
- **Type Safety**: Heavy use of generics and MapStruct
- **Testability**: Constructor injection, clear separation of concerns
- **Maintainability**: Strict package structure, clear naming conventions

When adding features, always ask: "Can I leverage the base infrastructure?" The generic system is designed to handle most common patterns without custom code.
