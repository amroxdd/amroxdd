-- BLOCK 2: Row Level Security and permissions (Labs 4, 6 and 7)
-- Removes any old policies on these tables first, so it is safe to re-run.

DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('category', 'product', 'customer', 'orderr', 'order_item')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

ALTER TABLE public.category   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orderr     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_item ENABLE ROW LEVEL SECURITY;

-- Lab 4: anyone can read the catalogue.
-- There is no insert/update/delete policy, so Lab 7's POST/PATCH/DELETE are blocked.
CREATE POLICY "Public read access" ON public.category
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read access" ON public.product
  FOR SELECT TO anon, authenticated USING (true);

-- Customers see only their own customer row
CREATE POLICY "Customers can view their own profile" ON public.customer
  FOR SELECT TO authenticated USING (auth.uid() = customer_id);

-- Lab 6: customers create and view only their own orders
CREATE POLICY "Customers can insert their own orders" ON public.orderr
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Customers can view their own orders" ON public.orderr
  FOR SELECT TO authenticated USING (auth.uid() = customer_id);

CREATE POLICY "Customers can insert their own order items" ON public.order_item
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.orderr o
            WHERE o.order_id = order_item.order_id AND o.customer_id = auth.uid())
  );
CREATE POLICY "Customers can view their own order items" ON public.order_item
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.orderr o
            WHERE o.order_id = order_item.order_id AND o.customer_id = auth.uid())
  );

-- Table permissions for the API roles
GRANT SELECT ON public.category, public.product TO anon, authenticated;
GRANT SELECT ON public.customer TO authenticated;
GRANT SELECT, INSERT ON public.orderr, public.order_item TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- EXPECTED: "Success. No rows returned"
-- Check with: SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';
-- You should see exactly 7 policies: category (1), product (1), customer (1), orderr (2), order_item (2).
