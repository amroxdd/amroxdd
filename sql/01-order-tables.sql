-- BLOCK 1: rebuild the customer / order / order_item tables (Labs 3 and 6)
-- Keeps your existing category and product tables and data untouched.
-- customer_id is a UUID that points to Supabase Auth users (auth.users).
-- Your order table keeps its name: orderr

DROP TABLE IF EXISTS public.order_item CASCADE;
DROP TABLE IF EXISTS public.orderr CASCADE;
DROP TABLE IF EXISTS public.customer CASCADE;

CREATE TABLE public.customer (
  customer_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE public.orderr (
  order_id SERIAL PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES auth.users(id),
  order_date TIMESTAMP DEFAULT now(),
  status TEXT DEFAULT 'Pending',
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  shipping_name TEXT,
  shipping_address TEXT,
  shipping_phone TEXT
);

CREATE TABLE public.order_item (
  order_item_id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES public.orderr(order_id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES public.product(product_id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price NUMERIC(10,2) NOT NULL
);

-- Every new sign-up automatically gets a row in customer
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.customer (customer_id, name, email)
  VALUES (NEW.id, COALESCE(NULLIF(NEW.raw_user_meta_data->>'name', ''), NEW.email), NEW.email)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add customer rows for users who registered before this trigger existed
INSERT INTO public.customer (customer_id, name, email)
SELECT id, COALESCE(NULLIF(raw_user_meta_data->>'name', ''), email), email
FROM auth.users
ON CONFLICT DO NOTHING;

-- EXPECTED: "Success. No rows returned"
-- Table Editor now shows customer, orderr and order_item.
