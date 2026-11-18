// ShopNow - product detail page.
// Loaded AFTER the Supabase CDN and js/app.js, so it reuses supabaseClient,
// addToCart, escapeHtml and formatPrice from app.js.

async function loadProductDetail() {
    const detail = document.getElementById("detail");

    if (!detail) return;

    const productId = Number(new URLSearchParams(window.location.search).get("id"));

    if (!productId) {
        detail.innerHTML = "<p>Product ID is missing from the URL.</p>";
        return;
    }

    const { data: product, error } = await supabaseClient
        .from("product")
        .select("*, category(category_name)")
        .eq("product_id", productId)
        .maybeSingle();

    if (error) {
        console.error("Supabase error:", error);
        detail.innerHTML = "<p>Error loading product details.</p>";
        return;
    }

    if (!product) {
        detail.innerHTML = "<p>Product not found.</p>";
        return;
    }

    const label = stockLabel(product.stock);
    const soldOut = Number(product.stock) <= 0;

    detail.innerHTML = `
        <h2>${escapeHtml(product.name)}</h2>
        <p>${escapeHtml(product.description || "")}</p>
        <p class="price">AED ${formatPrice(product.price)}</p>
        <p>Category: ${escapeHtml(product.category ? product.category.category_name : "-")}</p>
        <p class="stock stock-${label.css}">${label.text} (${Number(product.stock)} available)</p>
        <button id="detail-add-btn" class="btn" ${soldOut ? "disabled" : ""}>Add to Cart</button>
    `;

    document.getElementById("detail-add-btn").addEventListener("click", () => addToCart(product));
}

if (document.getElementById("detail")) {
    loadProductDetail();
}
