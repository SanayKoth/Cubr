package com.sanay.cubing_backend.common.exception;

public record ErrorResponse(
  int status,
  String error,
  String message,
  String path
){}