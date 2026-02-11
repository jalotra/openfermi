package com.law.tech.backend.base.statemachine.exceptions;

import com.law.tech.backend.base.exceptions.IErrorCode;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum TransitionErrorCode implements IErrorCode {
    TRANSITION_DENIED("TRANSITION_DENIED", "Transition denied by precondition check"),
    INVALID_TRANSITION("INVALID_TRANSITION", "No valid transition exists from the current state for the given event"),
    TRANSITION_EXECUTION_FAILED("TRANSITION_EXECUTION_FAILED", "An error occurred while executing the transition"),
    INVALID_STATE("INVALID_STATE", "Entity state does not map to any known state value"),
    STATE_MACHINE_ERROR("STATE_MACHINE_ERROR", "Internal state machine infrastructure failure");

    private final String code;
    private final String message;
}
