CREATE TABLE sessions (
    id   UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE solves (
    id         UUID PRIMARY KEY,
    time_ms    BIGINT NOT NULL,
    scramble   TEXT NOT NULL,
    timestamp  TIMESTAMPTZ NOT NULL,
    session_id UUID NOT NULL,
    CONSTRAINT fk_solves_session
        FOREIGN KEY (session_id) REFERENCES sessions(id)
);

CREATE INDEX idx_solves_session_id ON solves(session_id);