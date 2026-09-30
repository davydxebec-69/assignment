let products = [];

function getSaved(key, fallback) {
  return JSON.parse(localStorage.getItem(key)) || fallback;
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function updateCartBadge() {
  const count = getSaved('toy_cart', []).reduce((sum, item) => sum + item.quantity, 0);
  const badge = document.getElementById('cart-count');
  if (badge) badge.textContent = count;
}

async function loadProducts() {
  try {
    const response = await fetch('products.json');
    products = await response.json();

    if (document.getElementById('product-grid')) renderProducts(products);
    if (document.getElementById('featured-grid')) renderFeatured();
    if (document.getElementById('wishlist-grid')) renderWishlist();
  } catch (error) {
    console.error('Could not load product list:', error);
  }
}

function renderProducts(items, gridId = 'product-grid') {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  grid.innerHTML = '';

  items.forEach(product => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}">
      <h3>${product.name}</h3>
      <p>${product.category}</p>
      <p><strong>$${product.price.toFixed(2)}</strong></p>
      <button onclick="addToCart(${product.id})">Add to Cart</button>
    `;
    grid.appendChild(card);
  });
}

function addToCart(id) {
  const cart = getSaved('toy_cart', []);
  const item = cart.find(product => product.id === id);

  if (item) {
    item.quantity++;
  } else {
    const targetProduct = products.find(product => product.id === id);
    if (targetProduct) cart.push({ ...targetProduct, quantity: 1 });
  }

  save('toy_cart', cart);
  updateCartBadge();
  alert('Added to cart!');
}

function renderCart() {
  const list = document.getElementById('cart-list');
  const total = document.getElementById('cart-total');
  if (!list) return;

  const cart = getSaved('toy_cart', []);
  list.innerHTML = '';
  const grandTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  cart.forEach(item => {
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
      <div>
        <h4>${item.name}</h4>
        <p>$${item.price.toFixed(2)} x ${item.quantity}</p>
      </div>
      <div>
        <button onclick="changeQty(${item.id}, 1)">+</button>
        <button onclick="changeQty(${item.id}, -1)">-</button>
      </div>
    `;
    list.appendChild(row);
  });

  if (total) total.textContent = grandTotal.toFixed(2);
}

function changeQty(id, change) {
  let cart = getSaved('toy_cart', []);
  const item = cart.find(product => product.id === id);

  if (item) item.quantity += change;
  cart = cart.filter(product => product.quantity > 0);

  save('toy_cart', cart);
  renderCart();
  updateCartBadge();
}

function clearCart() {
  localStorage.removeItem('toy_cart');
  renderCart();
  updateCartBadge();
}

function renderFeatured() {
  renderProducts(products.slice(0, 2), 'featured-grid');
}

function renderWishlist() {
  const grid = document.getElementById('wishlist-grid');
  if (!grid) return;
  grid.innerHTML = '';
  const statuses = getSaved('toy_wishlist', {});

  products.forEach(product => {
    const status = statuses[product.id] || 'Not Interested';
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}">
      <h3>${product.name}</h3>
      <p>Status: <strong>${status}</strong></p>
      <select onchange="updateWishlist(${product.id}, this.value)">
        <option value="Not Interested" ${status === 'Not Interested' ? 'selected' : ''}>Not Interested</option>
        <option value="Interested" ${status === 'Interested' ? 'selected' : ''}>Interested</option>
        <option value="Owned" ${status === 'Owned' ? 'selected' : ''}>Owned</option>
      </select>
    `;
    grid.appendChild(card);
  });
}

function updateWishlist(id, status) {
  const statuses = getSaved('toy_wishlist', {});
  statuses[id] = status;
  save('toy_wishlist', statuses);
  renderWishlist();
}

document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  updateCartBadge();
  renderCart();

  document.getElementById('search-bar')?.addEventListener('input', event => {
    const query = event.target.value.toLowerCase();
    renderProducts(products.filter(product => product.name.toLowerCase().includes(query)));
  });

  document.getElementById('category-filter')?.addEventListener('change', event => {
    const category = event.target.value;
    renderProducts(category === 'All' ? products : products.filter(product => product.category === category));
  });

  document.getElementById('newsletter-form')?.addEventListener('submit', event => {
    event.preventDefault();
    save('newsletter_email', document.getElementById('news-email').value);
    document.getElementById('news-msg').textContent = 'Subscribed successfully!';
  });

  document.getElementById('support-form')?.addEventListener('submit', event => {
    event.preventDefault();
    save('support_msg', {
      name: document.getElementById('supp-name').value,
      email: document.getElementById('supp-email').value,
      message: document.getElementById('supp-msg').value
    });
    document.getElementById('supp-reply').textContent = 'Thank you! Message received.';
  });

  const checkoutForm = document.getElementById('checkout-form');
  if (checkoutForm) {
    const cart = getSaved('toy_cart', []);
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalElement = document.getElementById('checkout-total');
    if (totalElement) totalElement.textContent = total.toFixed(2);

    checkoutForm.addEventListener('submit', event => {
      event.preventDefault();
      save('last_order', cart);
      localStorage.removeItem('toy_cart');
      document.getElementById('success-banner').innerHTML = '<div class="success-message">Order Placed Successfully!</div>';
      checkoutForm.reset();
      updateCartBadge();
    });
  }

  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => header.nextElementSibling.classList.toggle('active'));
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => console.log('SW registration failed:', err));
  }
});