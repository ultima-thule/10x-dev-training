-- migration: update experience_level_enum to include 4 levels instead of 3
-- purpose: align database schema with product requirements (beginner/intermediate/advanced/expert)
-- related: US-004 Initial User Profile Setup, auth-spec.md Section 3.2

-- Step 1: Add new enum type with 4 levels
do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'experience_level_enum_new'
  ) then
    create type public.experience_level_enum_new as enum ('beginner', 'intermediate', 'advanced', 'expert');
  end if;
end;
$$;

-- Step 2: Update profiles table to use new enum type
-- This migration handles the case where profiles may already exist
alter table public.profiles 
  alter column experience_level type public.experience_level_enum_new 
  using (
    case experience_level::text
      when 'junior' then 'beginner'::public.experience_level_enum_new
      when 'mid' then 'intermediate'::public.experience_level_enum_new
      when 'senior' then 'advanced'::public.experience_level_enum_new
      else 'beginner'::public.experience_level_enum_new
    end
  );

-- Step 3: Drop old enum type
drop type public.experience_level_enum;

-- Step 4: Rename new enum type to original name
alter type public.experience_level_enum_new rename to experience_level_enum;

