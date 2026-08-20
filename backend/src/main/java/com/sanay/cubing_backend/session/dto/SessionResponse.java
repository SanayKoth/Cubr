package com.sanay.cubing_backend.session.dto;

import com.sanay.cubing_backend.session.Session;

import java.time.Instant;
import java.util.UUID;

public record SessionResponse(
        UUID id,
        String name,
        String event,
        Instant createdAt
) {

    public static SessionResponse from(Session session) {
        return new SessionResponse(
                session.getId(),
                session.getName(),
                session.getEvent(),
                session.getCreatedAt()
        );
    }
}
