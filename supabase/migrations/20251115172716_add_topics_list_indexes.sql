-- migration: add indexes for list topics endpoint optimization
-- purpose: improve query performance for filtering, sorting, and pagination in GET /api/topics
-- date: 2025-11-15

-- composite index for technology filtering (common query pattern)
create index if not exists idx_topics_user_technology on public.topics (user_id, technology);

-- composite index for parent_id filtering (hierarchical queries)
create index if not exists idx_topics_user_parent on public.topics (user_id, parent_id);

-- indexes for sorting by different fields
-- note: created_at desc already covered by insertion order, but explicit index helps query planner
create index if not exists idx_topics_user_created on public.topics (user_id, created_at desc);
create index if not exists idx_topics_user_updated on public.topics (user_id, updated_at desc);
create index if not exists idx_topics_user_title on public.topics (user_id, title);

-- composite index for common filter combinations
create index if not exists idx_topics_user_status_technology on public.topics (user_id, status, technology);
create index if not exists idx_topics_user_parent_status on public.topics (user_id, parent_id, status);

-- comment on indexes for documentation
comment on index idx_topics_user_technology is 'Optimizes queries filtering topics by technology for a specific user';
comment on index idx_topics_user_parent is 'Optimizes hierarchical queries and parent_id filtering';
comment on index idx_topics_user_created is 'Optimizes sorting topics by creation date (descending, most common)';
comment on index idx_topics_user_updated is 'Optimizes sorting topics by last update date';
comment on index idx_topics_user_title is 'Optimizes sorting topics alphabetically by title';
comment on index idx_topics_user_status_technology is 'Optimizes combined status and technology filters';
comment on index idx_topics_user_parent_status is 'Optimizes filtering by parent and status together';

