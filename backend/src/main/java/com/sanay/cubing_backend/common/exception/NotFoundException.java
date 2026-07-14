package com.sanay.cubing_backend.common.exception;

public class NotFoundException extends RuntimeException {
  public NotFoundException(String message){
    super(message);
  }
}