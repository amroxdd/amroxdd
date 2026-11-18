-- LAB 8: the required KPIs. Run each query on its own in the SQL Editor,
-- then use the download icon above the results grid to export CSV for Google Sheets.

/* 1. KPI - total revenue, number of orders, average order value */
SELECT SUM(total) AS total_revenue,
       COUNT(*) AS number_of_orders,
       ROUND(AVG(total), 2) AS avg_order_value
FROM public.orderr
WHERE status != 'Cancelled';

/* 2. KPI - number of customers */
SELECT COUNT(DISTINCT customer_id) AS number_of_customers
FROM public.orderr
WHERE status != 'Cancelled';

/* 3. KPI - top-selling products */
SELECT p.name, SUM(oi.quantity) AS units_sold
FROM public.order_item oi
JOIN public.product p ON oi.product_id = p.product_id
JOIN public.orderr o ON oi.order_id = o.order_id
WHERE o.status != 'Cancelled'
GROUP BY p.name
ORDER BY units_sold DESC
LIMIT 10;

/* 4. KPI - revenue by category */
SELECT c.category_name, SUM(oi.quantity * oi.price) AS category_revenue
FROM public.order_item oi
JOIN public.product p ON oi.product_id = p.product_id
JOIN public.category c ON p.category_id = c.category_id
JOIN public.orderr o ON oi.order_id = o.order_id
WHERE o.status != 'Cancelled'
GROUP BY c.category_name
ORDER BY category_revenue DESC;

/* 5. KPI - monthly sales trend */
SELECT DATE_TRUNC('month', order_date) AS month, SUM(total) AS monthly_revenue
FROM public.orderr
WHERE status != 'Cancelled'
GROUP BY month
ORDER BY month;

/* 6. KPI - order status distribution */
SELECT status, COUNT(*) AS orders
FROM public.orderr
GROUP BY status
ORDER BY orders DESC;

/* Extra: units sold vs. current stock (for the "restock or promote" questions) */
SELECT p.name, p.stock, COALESCE(SUM(oi.quantity), 0) AS units_sold
FROM public.product p
LEFT JOIN public.order_item oi ON oi.product_id = p.product_id
GROUP BY p.product_id, p.name, p.stock
ORDER BY units_sold DESC;
