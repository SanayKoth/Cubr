package com.sanay.cubing_backend.solve;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SolveRepository extends JpaRepository<Solve, UUID> {

    List<Solve> findBySessionIdOrderByTimestampAsc(UUID sessionId);
}
