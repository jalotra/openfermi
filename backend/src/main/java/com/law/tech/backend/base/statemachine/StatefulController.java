package com.law.tech.backend.base.statemachine;

import com.law.tech.backend.base.controllers.BaseController;
import com.law.tech.backend.base.models.GenericResponse;
import com.law.tech.backend.base.statemachine.exceptions.InvalidStateException;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

public abstract class StatefulController<
                T extends StatefulDto,
                E extends StatefulEntity,
                R extends StatefulRepository<E>,
                S extends Enum<S>,
                V extends Enum<V>>
        extends BaseController<T, E, R> {

    private final StatefulCrudService<T, E, R, S, V> statefulCrudService;
    private final Class<V> eventType;

    protected StatefulController(
            StatefulCrudService<T, E, R, S, V> statefulCrudService, Class<V> eventType) {
        super(statefulCrudService);
        this.statefulCrudService = statefulCrudService;
        this.eventType = eventType;
    }

    @PostMapping("/{id}/transition")
    public ResponseEntity<GenericResponse<T>> transition(
            @PathVariable UUID id, @RequestParam String event) {
        V parsedEvent = parseEvent(event);
        T result = statefulCrudService.transition(id, parsedEvent);
        return ResponseEntity.ok(
                GenericResponse.<T>builder().data(result).message("Transition successful").build());
    }

    @GetMapping("/{id}/available-events")
    public ResponseEntity<GenericResponse<List<String>>> availableEvents(@PathVariable UUID id) {
        List<V> events = statefulCrudService.getAvailableEvents(id);
        List<String> eventNames = events.stream().map(Enum::name).toList();
        return ResponseEntity.ok(GenericResponse.<List<String>>builder()
                .data(eventNames)
                .message("Success")
                .build());
    }

    @GetMapping("/{id}/debug")
    public ResponseEntity<GenericResponse<String>> debug(@PathVariable UUID id) {
        String dot = statefulCrudService.generateDebugDot(id);
        return ResponseEntity.ok(
                GenericResponse.<String>builder().data(dot).message("Success").build());
    }

    private V parseEvent(String eventName) {
        try {
            return Enum.valueOf(eventType, eventName);
        } catch (IllegalArgumentException e) {
            throw new InvalidStateException("Event", eventName);
        }
    }
}
