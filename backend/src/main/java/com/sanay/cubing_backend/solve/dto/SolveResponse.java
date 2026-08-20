package com.sanay.cubing_backend.solve.dto;

import com.sanay.cubing_backend.solve.Penalty;
import com.sanay.cubing_backend.solve.Solve;

import java.time.Instant;
import java.util.UUID;

public record SolveResponse(
        UUID id,
        UUID sessionId,
        long timeMs,
        String scramble,
        Instant timestamp,
        Penalty penalty
) {

    public static SolveResponse from(Solve solve, UUID sessionId) {
        return new SolveResponse(
                solve.getId(),
                sessionId,
                solve.getTimeMs(),
                solve.getScramble(),
                solve.getTimestamp(),
                solve.getPenalty()
        );
    }
}
