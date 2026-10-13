-- Email-bound vault invitations.
alter table public.vault_invites
  add column if not exists invited_email text
  check (invited_email is null or char_length(invited_email) between 3 and 320);

create index if not exists vault_invites_email_idx
  on public.vault_invites(lower(invited_email))
  where accepted_at is null and invited_email is not null;

create or replace function public.accept_vault_invite(invite_token uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  target_vault uuid;
  target_email text;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  select vault_id, invited_email into target_vault, target_email
  from public.vault_invites
  where token = invite_token and accepted_at is null and expires_at > now()
  for update;

  if target_vault is null then raise exception 'This invite is invalid or expired'; end if;
  if target_email is not null and lower(target_email) <> lower(coalesce(auth.jwt() ->> 'email', '')) then
    raise exception 'Sign in with the email address this invitation was sent to';
  end if;

  insert into public.vault_memberships(vault_id, user_id)
  values (target_vault, auth.uid()) on conflict do nothing;
  update public.vault_invites set accepted_at = now(), accepted_by = auth.uid() where token = invite_token;
  return target_vault;
end $$;

revoke execute on function public.accept_vault_invite(uuid) from public, anon;
grant execute on function public.accept_vault_invite(uuid) to authenticated;
