package com.sanay.cubing_backend.session.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateSessionRequest(
  @NotBlank String name
){}