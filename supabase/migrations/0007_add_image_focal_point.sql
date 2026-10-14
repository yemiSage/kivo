-- User-selected focal point used by cropped image previews.
alter table public.items
  add column if not exists image_position_x smallint not null default 50
    check (image_position_x between 0 and 100),
  add column if not exists image_position_y smallint not null default 50
    check (image_position_y between 0 and 100);
