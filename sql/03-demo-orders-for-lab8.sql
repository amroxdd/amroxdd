-- BLOCK 3 (optional): demo orders so the Lab 8 dashboard has data across several months.
-- Run this ONLY AFTER you registered at least one user on the website.
-- Orders are attached to the oldest registered user.

DO $$
DECLARE
  uid UUID;
  new_order_id INTEGER;
  rec RECORD;
  it RECORD;
BEGIN
  SELECT id INTO uid FROM auth.users ORDER BY created_at LIMIT 1;

  IF uid IS NULL THEN
    RAISE EXCEPTION 'Register a user on the website first, then run this block again.';
  END IF;

  FOR rec IN
    SELECT * FROM jsonb_to_recordset(
      '[{"d":95,"s":"Delivered","items":[[18,2],[23,3]]},
        {"d":80,"s":"Delivered","items":[[35,1],[36,2]]},
        {"d":62,"s":"Delivered","items":[[21,1],[24,2],[25,5]]},
        {"d":48,"s":"Shipped","items":[[29,1],[26,1]]},
        {"d":33,"s":"Delivered","items":[[18,1],[32,2]]},
        {"d":20,"s":"Processing","items":[[22,2],[23,2]]},
        {"d":9,"s":"Paid","items":[[36,3],[25,4]]},
        {"d":4,"s":"Cancelled","items":[[19,2]]}]'::jsonb
    ) AS x(d INT, s TEXT, items JSONB)
  LOOP
    INSERT INTO public.orderr
      (customer_id, order_date, status, total, shipping_name, shipping_address, shipping_phone)
    VALUES
      (uid, now() - make_interval(days => rec.d), rec.s, 0,
       'Demo Customer', 'Demo Street, Dubai', '+971501234567')
    RETURNING order_id INTO new_order_id;

    FOR it IN SELECT value FROM jsonb_array_elements(rec.items) LOOP
      INSERT INTO public.order_item (order_id, product_id, quantity, price)
      SELECT new_order_id, p.product_id, (it.value->>1)::INT, p.price
      FROM public.product p
      WHERE p.product_id = (it.value->>0)::INT;
    END LOOP;

    UPDATE public.orderr
    SET total = COALESCE((SELECT SUM(quantity * price) FROM public.order_item
                          WHERE order_id = new_order_id), 0)
    WHERE order_id = new_order_id;
  END LOOP;
END $$;

-- EXPECTED: "Success. No rows returned"
-- Then run: SELECT * FROM public.orderr ORDER BY order_id;  (8 extra orders, different months and statuses)
