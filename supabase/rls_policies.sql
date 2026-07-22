-- Run this in the Supabase SQL Editor for this project.
-- Public read access stays open; writes require a signed-in (authenticated) user.

alter table "engSongs" enable row level security;
alter table "chinSongs" enable row level security;

create policy "Public read" on "engSongs" for select using (true);
create policy "Public read" on "chinSongs" for select using (true);

create policy "Authenticated insert" on "engSongs" for insert with check (auth.role() = 'authenticated');
create policy "Authenticated update" on "engSongs" for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated delete" on "engSongs" for delete using (auth.role() = 'authenticated');

create policy "Authenticated insert" on "chinSongs" for insert with check (auth.role() = 'authenticated');
create policy "Authenticated update" on "chinSongs" for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated delete" on "chinSongs" for delete using (auth.role() = 'authenticated');
