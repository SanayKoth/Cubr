package com.sanay.cubing_backend.solve;

import com.sanay.cubing_backend.solve.dto.CreateSolveRequest;
import com.sanay.cubing_backend.solve.dto.SolveResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController; 

import java.util.List;
import java.util.UUID;

@RestController 
public class SolveController {

  private final SolveService solveService; 

  public SolveController(SolveService solveService) {
    this.solveService = solveService;
  }

  @PostMapping("/api/sessions/{sessionId}/solves")
  public ResponseEntity<SolveResponse> addSolve(
    @PathVariable UUID sessionId,
    @Valid @RequestBody CreateSolveRequest request) {
      Solve solve = solveService.addSolve(
        sessionId,
        request.id(),
        request.timeMs(),
        request.scramble(),
        request.timestamp()
      );
      return ResponseEntity.status(HttpStatus.CREATED).body(SolveResponse.from(solve, sessionId));
    }
    
    @GetMapping("/api/sessions/{sessionId}/solves")
    public ResponseEntity<List<SolveResponse>> listSolves(@PathVariable UUID sessionId) {
      List<SolveResponse> responses = solveService.listSolvesForSession(sessionId).stream()
        .map(solve -> SolveResponse.from(solve, sessionId))
        .toList();
      return ResponseEntity.ok(responses);
    }

    @DeleteMapping("/api/solves/{solveId}")
    public ResponseEntity<Void> deleteSolve(@PathVariable UUID solveId){
      solveService.deleteSolve(solveId); 
      return ResponseEntity.noContent().build();
    }
}

