package com.sanay.cubing_backend.solve.dto;

import com.sanay.cubing_backend.solve.Penalty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.Instant;
import java.util.UUID;

public record CreateSolveRequest(
        @NotNull UUID id,
        @Positive long timeMs,
        @NotBlank String scramble,
        @NotNull Instant timestamp,
        Penalty penalty
) {
}
