package com.sanay.cubing_backend.session.dto;

import com.sanay.cubing_backend.session.Session;

import java.util.UUID;

public record SessionResponse(
  UUID id,
  String name
){
  public static SessionResponse from(Session session){
    return new SessionResponse(session.getId(), session.getName());
  }
}
