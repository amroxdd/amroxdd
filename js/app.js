const SUPABASE_URL = "https://bglysjcokqmvwhtlkdwo.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnbHlzamNva3FtdndodGxrZHdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyMDAzMjcsImV4cCI6MjEwNjc3NjMyN30.o6gFObF4Xbwr2SYGAQLiXmbdkbGO1ZkmuVUsRKw0axM";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

 document.getElementById("register-form").addEventListener("submit", async e => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) alert(error.message);
  else { alert("Account created — you can now log in."); window.location.href = "login.html"; }
});
// login.html
document.getElementById("login-form").addEventListener("submit", async e => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) alert(error.message);
  else window.location.href = "index.html";
});


const products = [
    {
        id: 1,
        name: "Business Laptop",
        category: "Computers",
        price: 3499,
        stock: 10
    },

    {
        id: 2,
        name: "IPhone17",
        category: "Phones",
        price: 299,
        stock: 25
    },

    {
        id: 3,
        name: "Camera Device",
        category: "Samsung Camera",
        price: 180,
        stock: 0
    },
     {
        id: 4,
        name: "HP Laptop",
        category: "Computers",
        price: 2999,
        stock: 4
    },

    {
        id: 5,
        name: "Lenovo Laptop",
        category: "Computers",
        price: 2599,
        stock: 8
    },

    {
        id: 6,
        name: "Wireless Mouse",
        category: "Accessories",
        price: 129,
        stock: 25
    },

    {
        id: 7,
        name: "Keyboard",
        category: "Accessories",
        price: 199,
        stock: 3
    },

    {
        id: 8,
        name: "USB-C Cable",
        category: "Accessories",
        price: 49,
        stock: 20
    },

    {
        id: 9,
        name: "Headphones",
        category: "Accessories",
        price: 299,
        stock: 6
    },

    {
        id: 10,
        name: "Smartphone",
        category: "Phones",
        price: 2499,
        stock: 0
    },

    {
        id: 11,
        name: "iPhone 15",
        category: "Phones",
        price: 3299,
        stock: 5
    },

    {
        id: 12,
        name: "Samsung Galaxy",
        category: "Phones",
        price: 2799,
        stock: 12
    },

    {
        id: 13,
        name: "Google Pixel",
        category: "Phones",
        price: 2399,
        stock: 2
    },

    {
        id: 14,
        name: "Tablet",
        category: "Computers",
        price: 1599,
        stock: 7
    },

    {
        id: 15,
        name: "Webcam",
        category: "Accessories",
        price: 179,
        stock: 10
    },

    {
        id: 16,
        name: "Gaming Monitor",
        category: "Computers",
        price: 1899,
        stock: 0
    },

    {
        id: 17,
        name: "Power Bank",
        category: "Accessories",
        price: 99,
        stock: 1
    }
];

// Step 2 
function renderProducts(list) {
  const container = document.getElementById("product-list");
  if (!container) {
    return;
  }
  container.innerHTML = "";
  if (list.length === 0) {
    container.innerHTML = "<p>No products match your search.</p>";
    return;
  }
  list.forEach(product => {

    const stockLabel =
      product.stock === 0
        ? "Out of Stock"
        : product.stock <= 5
        ? "Low Stock"
        : "In Stock";


    container.innerHTML += `
      <div class="product">
        <h3>${product.name}</h3>
        <p>Category: ${product.category}</p>
        <p>AED ${product.price.toLocaleString()}</p>
        <p class="stock">${stockLabel}</p>
        
        <button
          ${product.stock === 0 ? "disabled" : ""}
          onclick="addToCart(${JSON.stringify(product)})"
        >
          ${product.stock === 0 ? "Out of Stock" : "Add to Cart"}
        </button>
        <a href="product-detail.html?id=${product.product_id}">View details</a>
      </div>
    `;
  });
}


// Add to cart
function addToCart(product_id) {
  const product = products.find(product => product.id === product_id);
  if (!product) {
    return;
  }
  if (product.stock === 0) {
    alert("This product is out of stock.");
    return;
  }
  alert(product.name + " has been added to your cart!");
}

// Search
const searchBox = document.getElementById("search-box");

if (searchBox) {
  searchBox.addEventListener("input", function (event) {
    const term = event.target.value.toLowerCase();
    const filteredProducts = products.filter(product =>
      product.name.toLowerCase().includes(term)
    );
    renderProducts(filteredProducts);
  });
}

// Category buttons
document.querySelectorAll(".category-btn").forEach(button => {

  button.addEventListener("click", function () {
    const category = button.dataset.category;
    if (category === "All") {
      renderProducts(products);
    } else {
      const filteredProducts = products.filter(
        product => product.category === category
      );
      renderProducts(filteredProducts);
    }
  });
});

// Sort products
const sortSelect = document.getElementById("sort-select");

if (sortSelect) {

  sortSelect.addEventListener("change", function (event) {
    let sortedProducts = [...products];
    if (event.target.value === "low-high") {
      sortedProducts.sort((a, b) => a.price - b.price);
    } else if (event.target.value === "high-low") {
      sortedProducts.sort((a, b) => b.price - a.price);
    }
    renderProducts(sortedProducts);
  });
}
// Show all products when page loads
renderProducts(products);

async function loadProducts() {
  const { data: products, error } = await supabaseClient
    .from("product")
    .select("*, category(category_name)")
    .order("name");
 
  if (error) {
    document.getElementById("product-list").innerHTML =
      `<p>Could not load products: ${error.message}</p>`;
    return;
  }
  renderProducts(products);
}
 
loadProducts(); 

//lab5
function getCart() {
  return JSON.parse(localStorage.getItem("cart") || "[]");
}
 
function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}
 
function addToCart(product) {
  const cart = getCart();
  const existing = cart.find(item => item.product_id === product.product_id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  saveCart(cart);
}
 
function removeFromCart(productId) {
  saveCart(getCart().filter(item => item.product_id !== productId));

  function updateQuantity(productId, quantity) {
  if (quantity <= 0) return removeFromCart(productId);
  const cart = getCart().map(item =>
    item.product_id === productId ? { ...item, quantity } : item
  );
  saveCart(cart);
}

}

function renderCart() {
  const cart = getCart();
  const container = document.getElementById("cart-items");
  if (cart.length === 0) {
    container.innerHTML = "<p>Your cart is empty.</p>";
    return;
  }
  let subtotal = 0;
  container.innerHTML = cart.map(item => {
    subtotal += item.price * item.quantity;
    return `
      <div>
        <span>${item.name}</span>
        <input type="number" value="${item.quantity}"
          onchange="updateQuantity(${item.product_id}, this.value); renderCart();">
        <span>AED ${(item.price * item.quantity).toFixed(2)}</span>
        <button onclick="removeFromCart(${item.product_id}); renderCart();">Remove</button>
      </div>`;
  }).join('');
  document.getElementById("subtotal").textContent = subtotal.toFixed(2);
}
renderCart();

async function updateNavForAuth() {
  const { data: { user } } = await supabase.auth.getUser();
  const navSlot = document.getElementById("auth-nav-slot");
  if (user) {
    navSlot.innerHTML = `<span>Hi, ${user.email}</span> <a href="#" onclick="logout()">Log out</a>`;
  } else {
    navSlot.innerHTML = `<a href="login.html">Login</a>`;
  }
}
 
async function logout() {
  await supabase.auth.signOut();
  window.location.href = "index.html";
}
 
updateNavForAuth();

async function requireLogin() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) window.location.href = "login.html";
  return user;
}
