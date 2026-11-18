// =====================================================================
// ShopNow - shared app.js (Labs 2 to 6 and Lab 9)
// ONE file used by every page. Page-specific code only runs when that
// page's elements exist (see the guarded blocks at the bottom).
// =====================================================================

const SUPABASE_URL = "https://bglysjcokqmvwhtlkdwo.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_j5zqh7W6WVBHf2-evZo_JQ_2qSxHrGm";

// The CDN script creates a global called "supabase", so our client gets a
// different name and is used everywhere (also reused by js/detail.js).
const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

// ---------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------
function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function formatPrice(value) {
    return Number(value).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function showToast(message) {
    let toast = document.getElementById("toast");

    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toast";
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

// ---------------------------------------------------------------------
// Lab 2 + Lab 4: products (loaded from Supabase) with search, category
// filter and sorting that all work together
// ---------------------------------------------------------------------
let allProducts = [];
let currentCategory = "All";
let searchTerm = "";
let sortOrder = "default";

// Every product that has been drawn on the page, so buttons can find it by id
const productIndex = {};

function getCategoryName(prod) {
    return prod.category ? prod.category.category_name : "";
}

function stockLabel(stock) {
    const qty = Number(stock);
    if (qty <= 0) return { text: "Out of Stock", css: "out" };
    if (qty <= 5) return { text: "Low Stock", css: "low" };
    return { text: "In Stock", css: "in" };
}

function renderProducts(list, containerId = "product-list") {
    const container = document.getElementById(containerId);

    if (!container) return;

    if (list.length === 0) {
        container.innerHTML = "<p>No products found.</p>";
        return;
    }

    container.innerHTML = list.map(prod => {
        productIndex[prod.product_id] = prod;

        const label = stockLabel(prod.stock);
        const soldOut = Number(prod.stock) <= 0;

        return `
            <div class="product">
                <h3>${escapeHtml(prod.name)}</h3>
                <p class="category">${escapeHtml(getCategoryName(prod))}</p>
                <p class="price">AED ${formatPrice(prod.price)}</p>
                <p class="stock stock-${label.css}">${label.text}</p>
                <button class="add-btn" data-id="${prod.product_id}" ${soldOut ? "disabled" : ""}>
                    Add to Cart
                </button>
                <a href="product-detail.html?id=${prod.product_id}">View Details</a>
            </div>
        `;
    }).join("");
}

function updateProductView() {
    let filtered = [...allProducts];

    if (currentCategory !== "All") {
        filtered = filtered.filter(p => getCategoryName(p) === currentCategory);
    }

    if (searchTerm) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm));
    }

    if (sortOrder === "low-high") {
        filtered.sort((a, b) => Number(a.price) - Number(b.price));
    }

    if (sortOrder === "high-low") {
        filtered.sort((a, b) => Number(b.price) - Number(a.price));
    }

    renderProducts(filtered);
}

async function fetchProducts() {
    const { data, error } = await supabaseClient
        .from("product")
        .select("*, category(category_name)")
        .order("name");

    if (error) {
        console.error("Supabase error:", error);
        return { data: [], error };
    }

    return { data: data || [], error: null };
}

// Only draw category buttons for categories that really exist in the database
function renderCategoryButtons() {
    const holder = document.getElementById("category-buttons");

    if (!holder) return;

    const names = [...new Set(allProducts.map(getCategoryName).filter(Boolean))].sort();

    holder.innerHTML = ["All", ...names].map(name => `
        <button class="category-btn ${name === currentCategory ? "active" : ""}"
                data-category="${escapeHtml(name)}">${escapeHtml(name)}</button>
    `).join("");
}

async function loadProducts() {
    const container = document.getElementById("product-list");

    if (!container) return;

    container.innerHTML = "<p>Loading products...</p>";

    const { data, error } = await fetchProducts();

    if (error) {
        container.innerHTML = `<p>Could not load products: ${escapeHtml(error.message)}</p>`;
        return;
    }

    allProducts = data;
    renderCategoryButtons();
    updateProductView();
}

function initProductsPage() {
    const searchBox = document.getElementById("search-box");
    const sortSelect = document.getElementById("sort-select");
    const categoryHolder = document.getElementById("category-buttons");

    if (searchBox) {
        searchBox.addEventListener("input", e => {
            searchTerm = e.target.value.trim().toLowerCase();
            updateProductView();
        });
    }

    if (sortSelect) {
        sortSelect.addEventListener("change", e => {
            sortOrder = e.target.value;
            updateProductView();
        });
    }

    if (categoryHolder) {
        categoryHolder.addEventListener("click", e => {
            const btn = e.target.closest(".category-btn");
            if (!btn) return;

            currentCategory = btn.dataset.category;
            renderCategoryButtons();
            updateProductView();
        });
    }

    loadProducts();
}

// Home page: first four products as "featured"
async function loadFeaturedProducts() {
    const { data, error } = await fetchProducts();

    if (error) {
        document.getElementById("featured-products").innerHTML =
            `<p>Could not load products: ${escapeHtml(error.message)}</p>`;
        return;
    }

    renderProducts(data.slice(0, 4), "featured-products");
}

// ---------------------------------------------------------------------
// Lab 5: cart (localStorage)
// ---------------------------------------------------------------------
function getCart() {
    try {
        return JSON.parse(localStorage.getItem("cart") || "[]");
    } catch (err) {
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
}

function addToCart(product) {
    const productId = Number(product.product_id);
    const stock = Number(product.stock);

    if (stock <= 0) {
        showToast("Sorry, this product is out of stock.");
        return;
    }

    const cart = getCart();
    const existing = cart.find(item => Number(item.product_id) === productId);

    if (existing) {
        if (Number(existing.quantity) + 1 > stock) {
            showToast("No more stock available for this product.");
            return;
        }
        existing.quantity = Number(existing.quantity) + 1;
    } else {
        cart.push({
            product_id: productId,
            name: product.name,
            price: Number(product.price),
            stock: stock,
            quantity: 1
        });
    }

    saveCart(cart);
    showToast(`${product.name} added to cart`);
}

function removeFromCart(productId) {
    const cart = getCart().filter(
        item => Number(item.product_id) !== Number(productId)
    );

    saveCart(cart);
}

function updateQuantity(productId, quantity) {
    const cart = getCart();
    const item = cart.find(p => Number(p.product_id) === Number(productId));

    if (!item) return;

    let newQuantity = Math.floor(Number(quantity));

    if (isNaN(newQuantity) || newQuantity < 1) return;

    if (item.stock && newQuantity > Number(item.stock)) {
        newQuantity = Number(item.stock);
        showToast(`Only ${item.stock} in stock.`);
    }

    item.quantity = newQuantity;
    saveCart(cart);
}

function getCartSubtotal(cart) {
    return cart.reduce(
        (sum, item) => sum + Number(item.price) * Number(item.quantity),
        0
    );
}

function renderCart() {
    const container = document.getElementById("cart-items");
    const subtotalEl = document.getElementById("subtotal");

    if (!container) return;

    const cart = getCart();

    if (cart.length === 0) {
        container.innerHTML = "<p>Your cart is empty.</p>";
        if (subtotalEl) subtotalEl.textContent = "0.00";
        return;
    }

    container.innerHTML = cart.map(item => {
        const lineTotal = Number(item.price) * Number(item.quantity);

        return `
            <div class="cart-item">
                <span class="cart-name">${escapeHtml(item.name)}</span>
                <span>AED ${formatPrice(item.price)}</span>
                <input type="number" min="1" class="qty-input"
                       data-id="${item.product_id}" value="${Number(item.quantity)}">
                <span class="cart-line">AED ${formatPrice(lineTotal)}</span>
                <button class="remove-btn" data-id="${item.product_id}">Remove</button>
            </div>
        `;
    }).join("");

    if (subtotalEl) subtotalEl.textContent = formatPrice(getCartSubtotal(cart));
}

function initCartPage() {
    const container = document.getElementById("cart-items");

    container.addEventListener("change", e => {
        if (!e.target.classList.contains("qty-input")) return;

        updateQuantity(e.target.dataset.id, e.target.value);
        renderCart();
    });

    container.addEventListener("click", e => {
        if (!e.target.classList.contains("remove-btn")) return;

        removeFromCart(e.target.dataset.id);
        renderCart();
    });

    const checkoutButton = document.getElementById("checkout-btn");

    if (checkoutButton) {
        checkoutButton.addEventListener("click", async () => {
            if (getCart().length === 0) {
                alert("Your cart is empty!");
                return;
            }

            const user = await requireLogin();

            if (!user) return;

            window.location.href = "checkout.html";
        });
    }

    renderCart();
}

// ---------------------------------------------------------------------
// Lab 5: authentication
// ---------------------------------------------------------------------
async function updateNavForAuth() {
    const navSlot = document.getElementById("auth-nav-slot");

    if (!navSlot) return;

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (user) {
        navSlot.innerHTML = `
            <span class="nav-user">Hi, ${escapeHtml(user.email)}</span>
            <a href="#" id="logout-link">Log out</a>
        `;

        document.getElementById("logout-link").addEventListener("click", async e => {
            e.preventDefault();
            await logout();
        });
    } else {
        navSlot.innerHTML = '<a href="login.html">Login</a>';
    }
}

async function logout() {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        alert(error.message);
        return;
    }

    window.location.href = "index.html";
}

async function requireLogin() {
    const { data: { user }, error } = await supabaseClient.auth.getUser();

    if (error || !user) {
        window.location.href = "login.html";
        return null;
    }

    return user;
}

function initRegisterForm() {
    document.getElementById("register-form").addEventListener("submit", async e => {
        e.preventDefault();

        const nameInput = document.getElementById("name");
        const name = nameInput ? nameInput.value.trim() : "";
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: { data: { name } }
        });

        if (error) {
            alert("Registration error: " + error.message);
            return;
        }

        if (data.session) {
            alert("Account created. You are now logged in.");
            window.location.href = "index.html";
        } else {
            alert("Account created. Check your email to confirm it, then log in.");
            window.location.href = "login.html";
        }
    });
}

function initLoginForm() {
    document.getElementById("login-form").addEventListener("submit", async e => {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        const { error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            alert(error.message);
        } else {
            window.location.href = "index.html";
        }
    });
}

// ---------------------------------------------------------------------
// Lab 6: checkout and orders
// ---------------------------------------------------------------------
function renderCheckoutSummary() {
    const cart = getCart();
    const list = document.getElementById("checkout-items");

    list.innerHTML = cart.map(item => `
        <p>${escapeHtml(item.name)} &times; ${Number(item.quantity)}
           &mdash; AED ${formatPrice(Number(item.price) * Number(item.quantity))}</p>
    `).join("");

    document.getElementById("checkout-total").textContent =
        formatPrice(getCartSubtotal(cart));
}

async function placeOrder(name, address, phone) {
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
        window.location.href = "login.html";
        return false;
    }

    const cart = getCart();

    if (cart.length === 0) {
        alert("Your cart is empty!");
        return false;
    }

    // Use the real prices from the database, not the ones saved in the browser
    const ids = cart.map(item => Number(item.product_id));

    const { data: dbProducts, error: priceError } = await supabaseClient
        .from("product")
        .select("product_id, name, price, stock")
        .in("product_id", ids);

    if (priceError) {
        alert("Could not check product prices: " + priceError.message);
        return false;
    }

    const lines = [];

    for (const item of cart) {
        const real = (dbProducts || []).find(
            p => Number(p.product_id) === Number(item.product_id)
        );
        const quantity = Number(item.quantity);

        if (!real) {
            alert(`"${item.name}" is no longer available. Please update your cart.`);
            return false;
        }

        if (quantity > Number(real.stock)) {
            alert(`Only ${real.stock} of "${real.name}" left in stock.`);
            return false;
        }

        lines.push({
            product_id: Number(real.product_id),
            quantity: quantity,
            price: Number(real.price)
        });
    }

    const total = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);

    const { data: order, error: orderError } = await supabaseClient
        .from("orderr")
        .insert([{
            customer_id: user.id,
            total: total,
            status: "Paid",
            shipping_name: name,
            shipping_address: address,
            shipping_phone: phone
        }])
        .select()
        .single();

    if (orderError) {
        alert("Could not place order: " + orderError.message);
        return false;
    }

    const items = lines.map(l => ({
        order_id: order.order_id,
        product_id: l.product_id,
        quantity: l.quantity,
        price: l.price
    }));

    const { error: itemsError } = await supabaseClient
        .from("order_item")
        .insert(items);

    if (itemsError) {
        console.error("order_item insert failed:", itemsError);
        alert("Your order was created but its items could not be saved: " + itemsError.message);
        return false;
    }

    // Clear the cart only after BOTH inserts succeeded
    localStorage.removeItem("cart");
    window.location.href = `order-confirmation.html?id=${order.order_id}`;
    return true;
}

async function initializeCheckout() {
    const user = await requireLogin();

    if (!user) return;

    if (getCart().length === 0) {
        window.location.href = "cart.html";
        return;
    }

    renderCheckoutSummary();

    document.getElementById("checkout-form").addEventListener("submit", async e => {
        e.preventDefault();

        const name = document.getElementById("name").value.trim();
        const address = document.getElementById("address").value.trim();
        // Remove spaces so "+971 50 123 4567" is accepted
        const phone = document.getElementById("phone").value.replace(/\s+/g, "");

        if (name.length < 2) {
            alert("Please enter your full name.");
            return;
        }

        if (address.length < 5) {
            alert("Please enter your full address.");
            return;
        }

        if (!/^\+?[0-9]{7,15}$/.test(phone)) {
            alert("Enter a valid phone number, for example +971 50 123 4567.");
            return;
        }

        const button = document.getElementById("place-order-btn");
        button.disabled = true;
        button.textContent = "Placing order...";

        let succeeded = false;

        try {
            succeeded = await placeOrder(name, address, phone);
        } catch (err) {
            console.error("Unexpected error:", err);
            alert("Something went wrong. Check the browser console.");
        }

        if (!succeeded) {
            button.disabled = false;
            button.textContent = "Place Order";
        }
    });
}

async function loadConfirmation() {
    const user = await requireLogin();

    if (!user) return;

    const orderId = new URLSearchParams(window.location.search).get("id");
    const box = document.getElementById("confirmation");

    if (!orderId) {
        box.innerHTML = "<p>Order number is missing from the URL.</p>";
        return;
    }

    const { data: order, error: orderError } = await supabaseClient
        .from("orderr")
        .select("*")
        .eq("order_id", orderId)
        .maybeSingle();

    if (orderError || !order) {
        console.error(orderError);
        box.innerHTML = "<p>Order not found.</p>";
        return;
    }

    const { data: items, error: itemsError } = await supabaseClient
        .from("order_item")
        .select("*, product(name)")
        .eq("order_id", orderId);

    if (itemsError) {
        console.error(itemsError);
        box.innerHTML = `<p>Could not load order items: ${escapeHtml(itemsError.message)}</p>`;
        return;
    }

    document.getElementById("order-number").textContent = order.order_id;
    document.getElementById("order-status").textContent = order.status;
    document.getElementById("order-total").textContent = formatPrice(order.total);

    document.getElementById("items").innerHTML = (items || []).map(i => `
        <p>${escapeHtml(i.product ? i.product.name : "Product #" + i.product_id)}
           &times; ${Number(i.quantity)}
           &mdash; AED ${formatPrice(Number(i.price) * Number(i.quantity))}</p>
    `).join("");
}

// ---------------------------------------------------------------------
// Lab 9: smart product search (keyword scoring, no AI)
// ---------------------------------------------------------------------
function scoreProduct(product, queryWords) {
    const text = `${product.name} ${product.description || ""} ${getCategoryName(product)}`
        .toLowerCase();

    let score = 0;

    queryWords.forEach(word => {
        if (text.includes(word)) score += 1;
    });

    return score;
}

function extractMaxPrice(query) {
    const match = query.match(/(?:under|below)\s+(\d+)/i);

    if (!match) return null;

    return Number(match[1]);
}

function smartSearch(query, products) {
    const maxPrice = extractMaxPrice(query);

    const candidates = maxPrice
        ? products.filter(p => Number(p.price) <= maxPrice)
        : products;

    // Remove the "under 500" part, drop short filler words, and trim plurals
    const queryWords = query
        .toLowerCase()
        .replace(/(?:under|below)\s+\d+/g, " ")
        .split(/\s+/)
        .filter(w => w.length > 2)
        .map(w => (w.length > 3 && w.endsWith("s") ? w.slice(0, -1) : w));

    // Only a price rule, no words: show the cheapest matches
    if (queryWords.length === 0) {
        return maxPrice
            ? [...candidates].sort((a, b) => Number(a.price) - Number(b.price)).slice(0, 6)
            : [];
    }

    return candidates
        .map(p => ({ product: p, score: scoreProduct(p, queryWords) }))
        .filter(r => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 6)
        .map(r => r.product);
}

function initSmartSearch() {
    const input = document.getElementById("smart-search");
    const resultsDiv = document.getElementById("smart-results");

    input.addEventListener("input", async e => {
        const query = e.target.value.trim();

        if (query.length < 3) {
            resultsDiv.innerHTML = "";
            return;
        }

        if (allProducts.length === 0) {
            const { data } = await fetchProducts();
            allProducts = data;
        }

        const matches = smartSearch(query, allProducts);

        resultsDiv.innerHTML = matches.length
            ? matches.map(p => `
                <p><a href="product-detail.html?id=${p.product_id}">${escapeHtml(p.name)}</a>
                   &mdash; AED ${formatPrice(p.price)}
                   <small>(${escapeHtml(getCategoryName(p))})</small></p>
              `).join("")
            : "<p>No matches. Try different words.</p>";
    });
}

// ---------------------------------------------------------------------
// Page wiring: every page-specific piece is guarded by an element check
// ---------------------------------------------------------------------
updateNavForAuth();

document.addEventListener("click", e => {
    const btn = e.target.closest(".add-btn");

    if (!btn) return;

    const prod = productIndex[btn.dataset.id];

    if (prod) addToCart(prod);
});

if (document.getElementById("product-list")) {
    initProductsPage();
}

if (document.getElementById("smart-search")) {
    initSmartSearch();
}

if (document.getElementById("featured-products")) {
    loadFeaturedProducts();
}

if (document.getElementById("cart-items")) {
    initCartPage();
}

if (document.getElementById("register-form")) {
    initRegisterForm();
}

if (document.getElementById("login-form")) {
    initLoginForm();
}

if (document.getElementById("checkout-form")) {
    initializeCheckout();
}

if (document.getElementById("order-number")) {
    loadConfirmation();
}
