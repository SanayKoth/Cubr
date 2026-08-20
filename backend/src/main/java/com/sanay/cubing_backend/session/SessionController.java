package com.sanay.cubing_backend.session;

import com.sanay.cubing_backend.session.dto.CreateSessionRequest;
import com.sanay.cubing_backend.session.dto.SessionResponse;
import jakarta.validation.Valid;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sessions")
public class SessionController {

  private final SessionService sessionService;

  public SessionController(SessionService sessionService) {
    this.sessionService = sessionService;
  }

  @PostMapping
  public ResponseEntity<SessionResponse> createSession(@Valid @RequestBody CreateSessionRequest request) {
    Session session = sessionService.createSession(request.id(), request.name(), request.event());
    return ResponseEntity.status(HttpStatus.CREATED).body(SessionResponse.from(session));
  }

  @GetMapping
  public ResponseEntity<List<SessionResponse>> listSessions() {
    List<SessionResponse> responses = sessionService.listSessions().stream()
      .map(SessionResponse::from)
      .toList();
    return ResponseEntity.ok(responses);
  }
}