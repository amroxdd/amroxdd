-- LAB 6, Step 5: simulate an admin moving an order through
-- Pending -> Paid -> Processing -> Shipped -> Delivered.
-- Change 1 to an order_id that exists (see: SELECT * FROM public.orderr;)

UPDATE public.orderr SET status = 'Shipped' WHERE order_id = 1;

SELECT order_id, status, total FROM public.orderr WHERE order_id = 1;

-- EXPECTED: one row showing status = Shipped
