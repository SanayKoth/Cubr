package com.sanay.cubing_backend.session;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;
import java.util.List;

public interface SessionRepository extends JpaRepository<Session, UUID> {
  
  List<Session> findAllByOrderByCreatedAtAsc();
}