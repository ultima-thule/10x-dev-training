1. List of tables with their columns, data types, and constraints

#### Enum Types
- `experience_level_enum`: `('junior', 'mid', 'senior')`
- `topic_status_enum`: `('to_do', 'in_progress', 'completed')`

#### Table: `auth.users` (Supabase-managed)
- Provided by Supabase Auth. Primary key: `id uuid`.
- Serves as the parent record for all user-owned data via `profiles.id` and `topics.user_id`.

#### Table: `profiles`
- `id uuid PRIMARY KEY` — references `auth.users(id)` `ON DELETE CASCADE`.
- `experience_level experience_level_enum NOT NULL`.
- `years_away smallint NOT NULL CHECK (years_away BETWEEN 0 AND 60)`.
- `activity_streak integer NOT NULL DEFAULT 0 CHECK (activity_streak >= 0)`.
- `created_at timestamptz NOT NULL DEFAULT timezone('utc', now())`.
- `updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())`.

#### Table: `topics`
- `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`.
- `user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`.
- `parent_id uuid REFERENCES topics(id) ON DELETE CASCADE`.
- `title text NOT NULL`.
- `description text`.
- `status topic_status_enum NOT NULL DEFAULT 'to_do'`.
- `technology text NOT NULL`.
- `leetcode_links jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(leetcode_links) = 'array')`.
- `created_at timestamptz NOT NULL DEFAULT timezone('utc', now())`.
- `updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())`.

2. Relationships between tables

- `auth.users (1) —— (1) profiles`: One-to-one via shared primary key; deleting a Supabase user cascades to their profile.
- `auth.users (1) —— (N) topics`: A user owns many topics; cascading delete keeps orphan records from appearing.
- `topics (1) —— (N) topics`: Self-referencing hierarchy using `parent_id` with `ON DELETE CASCADE` so removing a parent removes its subtree.

3. Indexes

- `profiles_pkey` on `profiles(id)` (primary key / FK to `auth.users`).
- `idx_topics_user_id` on `topics(user_id)` to accelerate per-user queries and dashboard metrics.
- `idx_topics_parent_id` on `topics(parent_id)` for hierarchical fetches and cascade checks.
- `idx_topics_status` on `topics(status)` for status-based filtering (e.g., dashboard widgets).
- (Optional) `idx_topics_user_status` on `(user_id, status)` if status filters are always scoped to a user; add when query patterns confirm the need.

4. PostgreSQL policies (Row-Level Security)

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/write only their own profile row
CREATE POLICY profiles_self_select
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY profiles_self_mutate
  ON profiles FOR INSERT WITH CHECK (id = auth.uid())
  , FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Topics: users can access only their own topics
CREATE POLICY topics_self_select
  ON topics FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY topics_self_mutate
  ON topics FOR INSERT WITH CHECK (user_id = auth.uid())
  , FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())
  , FOR DELETE USING (user_id = auth.uid());
```

5. Additional notes

- Enable required extensions (`pgcrypto`) so `gen_random_uuid()` is available.
- Add a shared trigger function (e.g., `set_updated_at()`) to keep `updated_at` columns current on `INSERT/UPDATE`.
- `leetcode_links` stores an array of problem descriptors such as `[{ "title": "Two Sum", "url": "https://leetcode.com/...", "difficulty": "Easy" }]`; validation beyond the JSON shape can be enforced in application logic or via JSON schema checks later.
- Activity streak calculations live in `profiles.activity_streak`; business logic updates this field whenever a qualifying action occurs.

