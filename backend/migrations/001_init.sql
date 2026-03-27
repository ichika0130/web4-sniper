CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE projects (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name               VARCHAR(255)  NOT NULL,
  slug               VARCHAR(255)  UNIQUE NOT NULL,
  tagline            TEXT,
  website_url        TEXT,
  whitepaper_url     TEXT,
  github_url         TEXT,
  claimed_stack      TEXT[],
  real_stack         TEXT[],
  github_status      VARCHAR(20)   DEFAULT 'UNKNOWN',
  github_last_commit TIMESTAMPTZ,
  vaporware_score    INTEGER       DEFAULT 0 CHECK (vaporware_score BETWEEN 0 AND 100),
  verdict            VARCHAR(20)   DEFAULT 'UNKNOWN',
  one_liner          TEXT,
  funding_usd        NUMERIC(12,2),
  kloc_shipped       NUMERIC(8,2),
  created_at         TIMESTAMPTZ   DEFAULT NOW(),
  updated_at         TIMESTAMPTZ   DEFAULT NOW()
);

CREATE TABLE articles (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id   UUID REFERENCES projects(id) ON DELETE CASCADE,
  slug         VARCHAR(255)  UNIQUE NOT NULL,
  title        VARCHAR(500)  NOT NULL,
  author       VARCHAR(255)  DEFAULT 'The Sniper',
  body         JSONB         NOT NULL,
  published_at TIMESTAMPTZ,
  is_published BOOLEAN       DEFAULT FALSE,
  created_at   TIMESTAMPTZ   DEFAULT NOW(),
  updated_at   TIMESTAMPTZ   DEFAULT NOW()
);

CREATE TABLE buzzwords (
  id         UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  word       VARCHAR(255) NOT NULL,
  count      INTEGER      DEFAULT 1,
  week_start DATE         NOT NULL,
  UNIQUE(word, week_start)
);

CREATE INDEX idx_projects_slug       ON projects(slug);
CREATE INDEX idx_articles_slug       ON articles(slug);
CREATE INDEX idx_articles_published  ON articles(is_published, published_at DESC);
CREATE INDEX idx_buzzwords_week      ON buzzwords(week_start DESC);
