package com.sanay.cubing_backend.solve;

import com.sanay.cubing_backend.common.exception.NotFoundException;
import com.sanay.cubing_backend.session.Session;
import com.sanay.cubing_backend.session.SessionRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class SolveService {

  private final SolveRepository solveRepository;
  private final SessionRepository sessionRepository;

  public SolveService(SolveRepository solveRepository, SessionRepository sessionRepository) {
    this.solveRepository = solveRepository;
    this.sessionRepository = sessionRepository;
  }
  @Transactional
  public Solve addSolve(UUID sessionId, UUID id, long timeMs, String scramble, Instant timestamp) {
    Session session = sessionRepository.findById(sessionId)
      .orElseThrow(() -> new NotFoundException("Session not found: " + sessionId));
    
    Solve solve = new Solve();
    solve.setId(id);
    solve.setTimeMs(timeMs);
    solve.setScramble(scramble);
    solve.setTimestamp(timestamp);
    solve.setSession(session);

    return solveRepository.save(solve);
  }

  public List<Solve> listSolvesForSession(UUID sessionId) {
    return solveRepository.findBySessionIdOrderByTimestampAsc(sessionId);
  }
  @Transactional
  public void deleteSolve(UUID solveId) {
    solveRepository.deleteById(solveId);
  }
}