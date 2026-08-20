package com.sanay.cubing_backend.solve;

import com.sanay.cubing_backend.session.Session; 
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated; 
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "solves")
@Getter
@Setter
@NoArgsConstructor
public class Solve {

  @Id
  private UUID id; 

  @Column(nullable = false)
  private long timeMs; 

  @Column(nullable = false)
  private String scramble;

  @Column(nullable = false)
  private Instant timestamp; 

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 16)
  private Penalty penalty = Penalty.NONE;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "session_id", nullable = false)
  private Session session; 
}