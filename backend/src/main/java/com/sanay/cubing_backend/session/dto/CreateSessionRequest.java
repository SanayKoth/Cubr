package com.sanay.cubing_backend.session.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.util.UUID;

public record CreateSessionRequest(
        @NotNull UUID id,
        @NotBlank String name,
        @Pattern(regexp = "333oh|333bf|333fm|333|222|444|555|666|777|minx|pyram|skewb|sq1|clock")
        @NotBlank String event
) {
}
