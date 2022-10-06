export const newTableCommand = `DROP SCHEMA IF EXISTS cosmosdb_tutorial CASCADE;
CREATE SCHEMA cosmosdb_tutorial;
SET search_path to cosmosdb_tutorial;
CREATE TABLE github_users
(
  user_id bigint,
  url text,
  login text,
  avatar_url text,
  gravatar_id text,
  display_login text
);
CREATE TABLE github_events
(
  event_id bigint,
  event_type text,
  event_public boolean,
  repo_id bigint,
  payload jsonb,
  repo jsonb,
  user_id bigint,
  org jsonb,
  created_at timestamp
);
CREATE INDEX event_type_index ON github_events (event_type);
CREATE INDEX payload_index ON github_events USING GIN (payload jsonb_path_ops);
`;

export const newTableCommandForDisplay = `DROP SCHEMA IF EXISTS cosmosdb_tutorial CASCADE;
CREATE SCHEMA cosmosdb_tutorial;

-- Using schema created for tutorial
SET search_path to cosmosdb_tutorial;

CREATE TABLE github_users
(
  user_id bigint,
  url text,
  login text,
  avatar_url text,
  gravatar_id text,
  display_login text
);

CREATE TABLE github_events
(
  event_id bigint,
  event_type text,
  event_public boolean,
  repo_id bigint,
  payload jsonb,
  repo jsonb,
  user_id bigint,
  org jsonb,
  created_at timestamp
);

--Create indexes on events table
CREATE INDEX event_type_index ON github_events (event_type);
CREATE INDEX payload_index ON github_events USING GIN (payload jsonb_path_ops);`;

export const distributeTableCommand = `SET search_path to cosmosdb_tutorial;
SELECT create_distributed_table('github_users', 'user_id');
SELECT create_distributed_table('github_events', 'user_id');
`;

export const distributeTableCommandForDisplay = `-- Using schema created for the tutorial
SET search_path to cosmosdb_tutorial;

SELECT create_distributed_table('github_users', 'user_id');
SELECT create_distributed_table('github_events', 'user_id');`;

export const loadDataCommand = `SET search_path to cosmosdb_tutorial;
\\COPY github_users FROM PROGRAM 'wget -q -O - "$@" "https://examples.citusdata.com/users.csv"' WITH (FORMAT CSV);
\\COPY github_events FROM PROGRAM 'wget -q -O - "$@" "https://examples.citusdata.com/events.csv"' WITH (FORMAT CSV);
`;

export const loadDataCommandForDisplay = `-- Using schema created for the tutorial
SET search_path to cosmosdb_tutorial;

-- download users and store in table
\\COPY github_users FROM PROGRAM 'wget -q -O - "$@" "https://examples.citusdata.com/users.csv"' WITH (FORMAT CSV);
\\COPY github_events FROM PROGRAM 'wget -q -O - "$@" "https://examples.citusdata.com/events.csv"' WITH (FORMAT CSV);`;

export const queryCommand = `SET search_path to cosmosdb_tutorial;
SELECT count(*) FROM github_users;
SELECT created_at, event_type, repo->>'name' AS repo_name
FROM github_events
WHERE user_id = 3861633;
SELECT date_trunc('hour', created_at) AS hour, sum((payload->>'distinct_size')::int) AS num_commits FROM github_events WHERE event_type = 'PushEvent' AND payload @> '{"ref":"refs/heads/master"}' GROUP BY hour ORDER BY hour;
`;

export const queryCommandForDisplay = `-- Using schema created for the tutorial
SET search_path to cosmosdb_tutorial;

-- count all rows (across shards)
SELECT count(*) FROM github_users;

-- Find all events for a single user.
SELECT created_at, event_type, repo->>'name' AS repo_name
FROM github_events
WHERE user_id = 3861633;

-- Find the number of commits on the master branch per hour 
SELECT date_trunc('hour', created_at) AS hour, sum((payload->>'distinct_size')::int) AS num_commits FROM github_events WHERE event_type = 'PushEvent' AND payload @> '{"ref":"refs/heads/master"}' GROUP BY hour ORDER BY hour;`;
