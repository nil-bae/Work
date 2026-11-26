/* 눈싸움 상금: 한 번 1,000원 · 하루 최대 5만 원 (11-26) */
create or replace function public.wallet_reward(p_name text, p_key text, p_kind text, p_amount double precision) returns wallets language plpgsql security definer set search_path = public as $$
declare w wallets; per double precision; cap double precision; got double precision; give double precision; t text := _kst_day();
begin
  perform _auth(p_name, p_key); w := _wallet(p_name);
  if p_kind = 'snow' then per := 1000; cap := 50000;
  elsif p_kind = 'race' then per := 60000; cap := 100000;
  else raise exception 'bad_kind'; end if;
  select coalesce(sum(amount), 0) into got from wallet_ledger where name = p_name and kind = p_kind and day = t;
  give := greatest(0, least(coalesce(p_amount, 0), per, cap - got));
  if p_kind = 'snow' and exists (select 1 from wallet_ledger where name = p_name and kind = 'snow' and created_at > now() - interval '150 milliseconds') then give := 0; end if;
  if give > 0 then w.cash := w.cash + give; insert into wallet_ledger (name, kind, amount, day) values (p_name, p_kind, give, t); end if;
  return _save(w);
end $$;
notify pgrst, 'reload schema';
