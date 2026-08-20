package com.sanay.cubing_backend.session;

import com.sanay.cubing_backend.solve.Solve;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id; 
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor; 
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List; 
import java.util.UUID; 

@Entity
@Table(name = "sessions")
@Getter
@Setter 
@NoArgsConstructor 
public class Session {

  @Id
  private UUID id;

  @Column(nullable = false)
  private String name;

  @Column(nullable = false, length = 16)
  private String event;

  @CreationTimestamp
  @Column(nullable = false, updatable = false)
  private Instant createdAt;

  @OneToMany(mappedBy = "session", fetch = FetchType.LAZY)
  private List<Solve> solves = new ArrayList<>();
}