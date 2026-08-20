package com.sanay.cubing_backend.session.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateSessionRequest(
        @NotNull UUID id,
        @NotBlank String name,
        @NotBlank String event
) {
}
