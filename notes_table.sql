-- Lägg till notes-tabell
create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  body text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Textbaserad sökfunktion (används tills embeddings är på plats)
create or replace function search_chunks_text(
  query_text text,
  match_count int default 8,
  filter_course_id uuid default null
)
returns table (
  id uuid,
  content text,
  document_id uuid,
  course_id uuid,
  page_number int
)
language plpgsql
as $$
begin
  return query
  select c.id, c.content, c.document_id, c.course_id, c.page_number
  from chunks c
  where
    (filter_course_id is null or c.course_id = filter_course_id)
    and c.content ilike '%' || query_text || '%'
  limit match_count;
end;
$$;

select 'Notes och sökfunktion redo! ✓' as status;
