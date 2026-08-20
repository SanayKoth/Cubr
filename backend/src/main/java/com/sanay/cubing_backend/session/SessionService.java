package com.sanay.cubing_backend.session;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class SessionService {
  
  private final SessionRepository sessionRepository;

  public SessionService(SessionRepository sessionRepository){
    this.sessionRepository = sessionRepository;
  }

  @Transactional
  public Session createSession(UUID id, String name, String event){
    Session session = new Session();
    session.setId(id);
    session.setName(name);
    session.setEvent(event);
    return sessionRepository.save(session);
  }

  public List<Session> listSessions(){
    return sessionRepository.findAllByOrderByCreatedAtAsc();
  }
}