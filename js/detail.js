const SUPABASE_URL ="https://bglysjcokqmvwhtlkdwo.supabase.co";
const SUPABASE_ANON_KEY ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnbHlzamNva3FtdndodGxrZHdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyMDAzMjcsImV4cCI6MjEwNjc3NjMyN30.o6gFObF4Xbwr2SYGAQLiXmbdkbGO1ZkmuVUsRKw0axM";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const params = new URLSearchParams(window.location.search);
const product_id = params.get("id");

async function loadProduct() {
  const container = document.getElementById("detail");

  if (!product_id) {
    container.innerHTML = "<p>No product ID provided.</p>";
    return;
  }

  const { data: product, error } = await supabaseClient
    .from("product")
    .select("*, category(category_name)")
    .eq("product_id", product_id)
    .single();

  if (error) {
    console.error("Product loading error:", error);
    container.innerHTML = "<p>Could not load product details.</p>";
    return;
  }

  container.innerHTML = `
    <div class="product-detail">
      <h2>${product.name}</h2>
      <p>${product.description ?? "No description available."}</p>
      <p>Price: AED ${product.price}</p>
      <p>Stock: ${product.stock}</p>
      <p>Category: ${
        product.category?.category_name ?? "Uncategorized"
      }</p>
      <a href="index.html">Back to products</a>
    </div>
  `;
}

loadProduct();