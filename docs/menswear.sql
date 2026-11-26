/* 부티크 남성 옷 10종 가격 (11-26). 여러 번 실행해도 안전 */
insert into public.shop_prices (id, price) values ('denim', 260000), ('varsity', 320000), ('puffer', 350000), ('rider', 380000), ('trench', 420000), ('longcoat', 460000), ('tie', 60000), ('cap', 50000), ('beanie', 40000), ('briefcase', 250000) on conflict (id) do update set price = excluded.price;
