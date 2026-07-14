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
  public Session createSession(String name){
    Session session = new Session();
    session.setId(UUID.randomUUID());
    session.setName(name);
    return sessionRepository.save(session);
  }

  public List<Session> listSessions(){
    return sessionRepository.findAll();
  }
}