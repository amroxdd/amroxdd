# ShopNow: setup, testing and submission guide (Labs 1 to 9)

Supabase project: `https://bglysjcokqmvwhtlkdwo.supabase.co`
Publishable key (safe to share, it is in `js/app.js`): `sb_publishable_j5zqh7W6WVBHf2-evZo_JQ_2qSxHrGm`

## 1. Supabase setup (once)

1. Authentication → Sign In / Providers → Email → turn **Confirm email** OFF → Save.
2. SQL Editor → New query → paste `sql/01-order-tables.sql` → Run. Expect "Success. No rows returned".
3. New query → paste `sql/02-rls-policies.sql` → Run. Expect "Success. No rows returned".
4. (After you register a user on the site) New query → `sql/03-demo-orders-for-lab8.sql` → Run, optional, for Lab 8 data.

Your `category` and `product` tables and their data are kept as they are.

## 2. Run the site

In the Codespace terminal: `python3 -m http.server 8000`, then open the forwarded port 8000.
Locally in VS Code, the "Live Server" extension works too.

## 3. Test checklist (Labs 1 to 6)

| Step | What to do | What you should see |
|---|---|---|
| Home | Open `index.html` | Navbar (Home, Products, Cart, About, Login) and 4 featured products |
| Products | Open Products | 20 products, buttons All / Accessories / Cameras / Computers / Phones, search box, sort |
| Filter | Click Phones, type "sam", sort High to Low | All three apply together |
| Detail | Click "View Details" | Name, description, price, category, stock, Add to Cart |
| Register | Register page, create account | "Account created", navbar shows "Hi, your@email" |
| Logout / Login | Log out, then log in again | Navbar switches between Login and your email |
| Cart | Add 2 to 3 products, change quantity, remove one, reload | Line totals and subtotal update and survive reload |
| Checkout guard | Log out, click "Proceed to Checkout" | Sent to login page |
| Checkout | Logged in, Proceed to Checkout, fill name / address / `+971 50 123 4567` | Place Order button greys out while saving |
| Confirmation | After placing order | Order number, status Paid, items (name × qty — AED price), total; cart now empty |
| Supabase | Table Editor → `orderr` and `order_item` | One new order row with your user id, and one row per cart item |

## 4. Screenshots for submission

- **Lab 1:** home, products and about pages, plus the GitHub repository page.
- **Lab 2:** products page using search, category filter and sort together.
- **Lab 3:** Table Editor showing the 5 tables (category, product, customer, orderr, order_item) and a JOIN query result.
- **Lab 4:** product list from the database. Then edit a price in Table Editor and refresh to show the change. Also the detail page.
- **Lab 5:** cart with quantities and subtotal after reload; register, login and logout; navbar showing your email.
- **Lab 6:** full run login → product → cart → checkout → confirmation; `orderr` and `order_item` rows; result of `sql/04-order-status-demo.sql`.
- **Lab 7:** terminal output of the curl commands below; DevTools Network tab showing the `product?select=...` request.
- **Lab 8:** Google Sheets dashboard (4 KPIs, 4 charts, a filter) and the queries in `sql/05-lab8-analytics.sql`.
- **Lab 9:** smart search with the test queries below, including the one that fails.

## 5. Lab 7: curl commands (run in the Codespace terminal)

```bash
K="sb_publishable_j5zqh7W6WVBHf2-evZo_JQ_2qSxHrGm"
B="https://bglysjcokqmvwhtlkdwo.supabase.co/rest/v1"

# GET all products  -> 200 and a JSON array
curl -i "$B/product?select=*" -H "apikey: $K" -H "Authorization: Bearer $K"

# Filters  -> 200
curl -i "$B/product?price=lt.1000" -H "apikey: $K" -H "Authorization: Bearer $K"
curl -i "$B/product?select=name,price&order=name.asc" -H "apikey: $K" -H "Authorization: Bearer $K"
curl -i "$B/product?category_id=eq.2" -H "apikey: $K" -H "Authorization: Bearer $K"

# POST  -> 401, "new row violates row-level security policy for table product"
curl -i -X POST "$B/product" -H "apikey: $K" -H "Authorization: Bearer $K" \
  -H "Content-Type: application/json" -H "Prefer: return=representation" \
  -d '{"name": "USB-C Hub", "price": 149, "stock": 20, "category_id": 2}'

# PATCH  -> 204 No Content, but NOTHING changes (RLS hides the row from updates)
curl -i -X PATCH "$B/product?product_id=eq.18" -H "apikey: $K" -H "Authorization: Bearer $K" \
  -H "Content-Type: application/json" -d '{"stock": 5}'

# Same PATCH asking for the result back  -> 200 with [] (zero rows were updated)
curl -i -X PATCH "$B/product?product_id=eq.18" -H "apikey: $K" -H "Authorization: Bearer $K" \
  -H "Content-Type: application/json" -H "Prefer: return=representation" -d '{"stock": 5}'

# DELETE  -> 204, but nothing is deleted (no DELETE policy)
curl -i -X DELETE "$B/product?product_id=eq.18" -H "apikey: $K" -H "Authorization: Bearer $K"

# Missing key  -> 401
curl -i "$B/product?select=*"
```

Why the writes fail: the `product` table only has a public SELECT policy (Lab 4). The anon key can read, but RLS rejects
INSERT with 401 and silently matches zero rows for UPDATE and DELETE. That is why PATCH and DELETE return 204, or `[]`
when you ask for the result, and the data stays the same. Only a policy, or the secret key used on a server, could change products.

## 6. Lab 9: smart search test queries (Products page, "Smart search" box)

| Query | Expected |
|---|---|
| `laptop` | Business Laptop, HP Laptop, Lenovo Laptop, MacBook Air... |
| `accessories under 200` | Only Accessories priced at most AED 200 (mouse, keyboard, cable, webcam, power bank) |
| `samsung phone` | Samsung Galaxy / Galaxy S25 first (they match both words) |
| `notebook` | **Fails**: no matches, because the data says "laptop", not "notebook" |
| `cheap headphones` | Headphones are found, but "cheap" is ignored; it only understands "under N" |

Reflection: keyword scoring only matches the exact words in the data. An embeddings or LLM-based system turns the query and
each product into meaning vectors, so "notebook" would land near "laptop", and "cheap" or "budget" would be understood as a
low price without a hand-written regex.

## 7. Lab 8: dashboard results and insights

KPIs (orders that are not Cancelled): total revenue **AED 45,110**, **10** orders, **1** customer, average order value **AED 4,511**.
Revenue by category: Computers 33,490 · Accessories 8,821 · Phones 2,799. Monthly: Aug 13,482 · Sep 3,642 · Oct 12,411 · Nov 15,575.

1. Computers earned AED 33,490 of AED 45,110 revenue (74%), although they are only 6 of the 20 products (30%).
2. Accessories sell the most units: USB-C Cable 9, Wireless Mouse 8, AirPods Pro 7. Keyboard has only 3 left, so restock it.
3. Revenue fell in September (AED 3,642) but rose in October (12,411) and November (15,575, +25% month on month).
4. Samsung Galaxy S25 (8 in stock), Tablet (7) and iPhone 15 (5) sold 0 units, so they should be promoted.

## 8. Lab 6: where a payment gateway fits

Today the Place Order button creates the `orderr` and `order_item` rows straight away, as if payment had succeeded. With a
real gateway such as Stripe, one step goes between "checkout form submitted" and "order rows created". The site sends the
cart total to a small server function, which creates a Stripe payment. The customer pays on Stripe's secure page. Stripe then
tells our server, through a webhook, that the charge succeeded. Only then is the order inserted, with status Paid, and the
customer sent to the confirmation page. The Stripe secret key lives only on that server, never in the browser.
