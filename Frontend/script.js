// =================================================================
// 1. FUNCTION DEFINITIONS
// =================================================================

async function loadOrderHistory() {
  const token = sessionStorage.getItem('authToken');
  const container = document.getElementById('order-history-container');
  const noOrdersMessage = document.getElementById('no-orders-message');
  if (!container) return;

  try {
    const response = await fetch('http://127.0.0.1:8000/api/orders/history/', {
      headers: { 'Authorization': `Token ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch order history');

    const orders = await response.json();

    if (orders.length === 0) {
      noOrdersMessage.style.display = 'block';
      return;
    }

    container.innerHTML = ''; // Clear loading message
    orders.forEach(order => {
      const orderDate = new Date(order.created_at).toLocaleDateString();
      const itemsHTML = order.items.map(item =>
        `<li>${item.quantity} x ${item.product.name}</li>`
      ).join('');

      const orderCardHTML = `
        <div class="accordion-item mb-3">
          <h2 class="accordion-header" id="heading-${order.id}">
            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${order.id}">
              <strong>Order #${order.id}</strong> - ${orderDate} - Total: ₹${order.total_price}
            </button>
          </h2>
          <div id="collapse-${order.id}" class="accordion-collapse collapse" data-bs-parent="#order-history-container">
            <div class="accordion-body">
              <strong>Shipping Address:</strong> ${order.shipping_address}<br/>
              <strong>Items:</strong>
              <ul>${itemsHTML}</ul>
            </div>
          </div>
        </div>
      `;
      container.innerHTML += orderCardHTML;
    });
  } catch (error) {
    console.error("Error loading order history:", error);
    container.innerHTML = '<p class="text-danger text-center">Could not load order history.</p>';
  }
}

async function fetchProducts() {
  try {
    const response = await fetch('http://127.0.0.1:8000/api/products/');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const products = await response.json();
    console.log("Successfully fetched products from backend:", products);
    displayProducts(products);
  } catch (error) {
    console.error("Could not fetch products:", error);
  }
}

function displayProducts(products) {
  const productGrids = document.querySelectorAll('.product-grid');
  productGrids.forEach(grid => {
    const category = grid.dataset.category;
    grid.innerHTML = '';
    const categoryProducts = products.filter(p => p.category === category);
    categoryProducts.forEach(product => {
      const cardHTML = `
        <div class="card" data-id="${product.id}" data-name="${product.name}" data-price="${product.price}">
            <div class="card-inner">
                <div class="card-front" style="background-image: url('http://127.0.0.1:8000/static/${product.image_url}');">
                    <h5>${product.name}</h5>
                    <span class="item-price">₹ ${product.price}</span>
                </div>
                <div class="card-back">${product.description}<div class="card-buttons"><button class="buy-now">Buy Now</button><button class="add-to-cart">Add to Cart</button></div></div>
            </div>
        </div>`;
      grid.innerHTML += cardHTML;
    });
  });
}

function updateCartBadge() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const cartBadges = document.querySelectorAll('.cart-badge');
  if (cartBadges.length > 0) {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartBadges.forEach(badge => badge.textContent = totalItems);
  }
}

function renderCartItems() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const cartItemsContainer = document.getElementById('cart-items');
  const cartTotalAmount = document.getElementById('cart-total-amount');
  const emptyCartMessage = document.getElementById('empty-cart-message');
  const checkoutBtn = document.getElementById('checkout-btn');

  if (!cartItemsContainer) return;
  cartItemsContainer.innerHTML = '';

  if (cart.length === 0) {
    if (emptyCartMessage) emptyCartMessage.style.display = 'block';
    if (checkoutBtn) checkoutBtn.style.display = 'none';
    if (cartTotalAmount) cartTotalAmount.textContent = '0.00';
    return;
  }

  if (emptyCartMessage) emptyCartMessage.style.display = 'none';
  if (checkoutBtn) checkoutBtn.style.display = 'block';
  let total = 0;

  cart.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    const itemHTML = `
      <div class="col-12">
          <div class="cart-item d-flex flex-wrap justify-content-between align-items-center p-3 mb-2 bg-light rounded">
              <img src="http://127.0.0.1:8000/static/Image/product.png" alt="Product thumbnail" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;" class="me-3">
              <div class="flex-grow-1" style="min-width: 150px;">
                  <h5 class="mb-1">${item.name}</h5>
                  <p class="mb-0 text-muted">Price: ₹${item.price.toFixed(2)}</p>
              </div>
              <div class="quantity-controls d-flex align-items-center my-2 mx-4">
                  <button class="btn btn-sm btn-secondary" onclick="updateCartItem(${index}, ${item.quantity - 1})">-</button>
                  <span class="mx-2">${item.quantity}</span>
                  <button class="btn btn-sm btn-secondary" onclick="updateCartItem(${index}, ${item.quantity + 1})">+</button>
              </div>
              <div class="price fw-bold mx-4">Subtotal: ₹${itemTotal.toFixed(2)}</div>
              <button class="btn btn-sm btn-danger" onclick="updateCartItem(${index}, 0)">Remove</button>
          </div>
      </div>`;
    cartItemsContainer.innerHTML += itemHTML;
  });

  if (cartTotalAmount) cartTotalAmount.textContent = total.toFixed(2);
}
function updateCartItem(index, quantity) {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  if (quantity <= 0) {
    cart.splice(index, 1);
  } else {
    cart[index].quantity = quantity;
  }
  localStorage.setItem('cart', JSON.stringify(cart));
  renderCartItems();
  updateCartBadge();
}

function renderOrderSummary() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const orderItemsContainer = document.getElementById('order-items');
  const subtotalEl = document.getElementById('order-subtotal');
  const taxesEl = document.getElementById('order-taxes');
  const totalEl = document.getElementById('order-total-amount');
  const deliveryEl = document.getElementById('order-delivery');

  if (!orderItemsContainer) return;
  if (cart.length === 0) {
    alert("Your cart is empty. Let's get shopping!");
    window.location.href = 'index.html';
    return;
  }

  orderItemsContainer.innerHTML = '';
  let subtotal = 0;

  cart.forEach(item => {
    subtotal += item.price * item.quantity;
    const itemHTML = `
        <div class="order-item">
            <img src="http://127.0.0.1:8000/static/Image/product.png" alt="${item.name}" class="item-thumbnail">
            <div class="item-details">
                <div class="item-name">${item.name} <span class="item-quantity">x ${item.quantity}</span></div>
            </div>
            <div class="item-price">₹${(item.price * item.quantity).toFixed(2)}</div>
        </div>`;
    orderItemsContainer.innerHTML += itemHTML;
  });

  const deliveryFee = 50.00;
  const taxRate = 0.05;
  const taxes = subtotal * taxRate;
  const total = subtotal + taxes + deliveryFee;

  if (subtotalEl) subtotalEl.textContent = `₹${subtotal.toFixed(2)}`;
  if (taxesEl) taxesEl.textContent = `₹${taxes.toFixed(2)}`;
  if (deliveryEl) deliveryEl.textContent = `₹${deliveryFee.toFixed(2)}`;
  if (totalEl) totalEl.textContent = `₹${total.toFixed(2)}`;
}

function setupPaymentMethodToggle() {
  const cardOption = document.getElementById('card-option');
  const qrOption = document.getElementById('qr-option');
  const cardForm = document.getElementById('card-payment-form');
  const qrInfo = document.getElementById('qr-payment-info');

  if (!cardOption) return;

  cardOption.addEventListener('change', () => {
    if (cardOption.checked) {
      cardForm.style.display = 'block';
      qrInfo.style.display = 'none';
    }
  });

  qrOption.addEventListener('change', () => {
    if (qrOption.checked) {
      cardForm.style.display = 'none';
      qrInfo.style.display = 'block';
    }
  });
}

function setupPlaceOrderButton() {
  const placeOrderBtn = document.getElementById('place-order-btn');
  if (!placeOrderBtn) return;

  placeOrderBtn.addEventListener('click', async () => {
    const token = sessionStorage.getItem('authToken');
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }
    const shippingAddress = document.getElementById('address').value;
    const city = document.getElementById('city').value;
    const zip = document.getElementById('zip').value;
    const fullAddress = `${shippingAddress}, ${city}, ${zip}`;

    const items = cart.map(item => ({
      product: item.id,
      quantity: item.quantity,
      price: item.price
    }));

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = 50.00;
    const taxRate = 0.05;
    const taxes = subtotal * taxRate;
    const total = subtotal + taxes + deliveryFee;

    const orderData = {
      total_price: total.toFixed(2),
      shipping_address: fullAddress,
      items: items
    };

    try {
      const response = await fetch('http://127.0.0.1:8000/api/orders/create/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
        body: JSON.stringify(orderData)
      });
      if (response.ok) {
        const newOrder = await response.json();
        alert('Order placed successfully!');
        localStorage.removeItem('cart');
        window.location.href = `confirmation.html?orderId=${newOrder.id}`;
      } else {
        const errorData = await response.json();
        alert(`Order failed: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('An error occurred while placing your order.');
    }
  });
}

async function loadUserProfile() {
  const token = sessionStorage.getItem('authToken');
  if (!token) return;
  try {
    const response = await fetch('http://127.0.0.1:8000/api/users/profile/', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` }
    });
    if (response.ok) {
      const data = await response.json();
      document.getElementById('account-name').value = data.username;
      document.getElementById('account-email').value = data.email;
    } else {
      console.error('Failed to load user profile.');
    }
  } catch (error) {
    console.error('Error loading user profile:', error);
  }
}

function setupUpdateProfileForm() {
  const updateBtn = document.getElementById('update-profile-btn');
  if (!updateBtn) return;
  updateBtn.addEventListener('click', async () => {
    const token = sessionStorage.getItem('authToken');
    const name = document.getElementById('account-name').value;
    const email = document.getElementById('account-email').value;
    try {
      const response = await fetch('http://127.0.0.1:8000/api/users/profile/', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
        body: JSON.stringify({ username: name, email: email })
      });
      if (response.ok) {
        alert('Profile updated successfully!');
        loadUserProfile();
      } else {
        const errorData = await response.json();
        alert(`Failed to update profile: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  });
}

function setupChangePasswordForm() {
  const changePasswordBtn = document.getElementById('update-password-btn');
  if (!changePasswordBtn) return;
  changePasswordBtn.addEventListener('click', async () => {
    const token = sessionStorage.getItem('authToken');
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match!');
      return;
    }
    try {
      const response = await fetch('http://127.0.0.1:8000/api/users/change-password/', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
        body: JSON.stringify({ old_password: currentPassword, new_password: newPassword })
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        document.getElementById('current-password').value = '';
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-password').value = '';
      } else {
        alert(`Error: ${JSON.stringify(data)}`);
      }
    } catch (error) {
      console.error('Error changing password:', error);
    }
  });
}

function setupContactForm() {
  const contactForm = document.getElementById('contact-form');
  if (!contactForm) return;

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = {
      name: document.getElementById('name').value,
      email: document.getElementById('email').value,
      subject: document.getElementById('subject').value,
      message: document.getElementById('message').value
    };

    try {
      const response = await fetch('http://127.0.0.1:8000/api/messaging/contact/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('Thank you for your message! We will get back to you shortly.');
        contactForm.reset(); // Clear the form
      } else {
        alert('There was an error sending your message. Please try again.');
      }
    } catch (error) {
      console.error('Contact form submission error:', error);
      alert('A network error occurred. Please try again.');
    }
  });
}

// =================================================================
// 2. MAIN EXECUTION BLOCK
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
  console.log("Script is running!");

  const currentPage = window.location.pathname.split('/').pop();
  const publicPages = ['Login.html', 'register.html', 'forgot.html'];

  if (!sessionStorage.getItem('isAuthenticated') && !publicPages.includes(currentPage)) {
    window.location.href = 'Login.html';
    return;
  }

  fetchProducts();
  updateCartBadge();

  document.body.addEventListener('click', function (event) {
    if (event.target.classList.contains('add-to-cart')) {
      const card = event.target.closest('.card');
      const itemId = parseInt(card.dataset.id);
      const itemName = card.dataset.name;
      const itemPrice = parseFloat(card.dataset.price);
      // We no longer need to get the individual image URL
      let cart = JSON.parse(localStorage.getItem('cart')) || [];
      const existingItem = cart.find(item => item.id === itemId);
      if (existingItem) {
        existingItem.quantity++;
      } else {
        // We no longer save the imageUrl to the cart
        cart.push({ id: itemId, name: itemName, price: itemPrice, quantity: 1 });
      }
      localStorage.setItem('cart', JSON.stringify(cart));
      updateCartBadge();
      alert(`${itemName} has been added to your cart!`);
    }
  });


  const navLinks = document.querySelectorAll('.navbar-links a');
  navLinks.forEach(link => {
    if (link.getAttribute('href') === currentPage) {
      link.classList.add('active');
    }
  });

  const logoutButton = document.getElementById('logout-button');
  if (logoutButton) {
    logoutButton.addEventListener('click', async (e) => {
      e.preventDefault();
      const token = sessionStorage.getItem('authToken');
      try {
        await fetch('http://127.0.0.1:8000/api/users/logout/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` }
        });
      } catch (error) {
        console.error("Error during logout:", error);
      }
      sessionStorage.clear();
      localStorage.removeItem('cart');
      window.location.href = 'Login.html?logout=success';
    });
  }

  if (currentPage === 'cart.html') {
    renderCartItems();
  }
  if (currentPage === 'checkout.html') {
    renderOrderSummary();
    setupPaymentMethodToggle();
    setupPlaceOrderButton();
  }
  if (currentPage === 'confirmation.html') {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');
    if (orderId) {
      document.getElementById('order-id').textContent = `#BB${orderId}`;
    }
  }
  if (currentPage === 'account.html') {
    loadUserProfile();
    setupUpdateProfileForm();
    setupChangePasswordForm();
  }

  if (currentPage === 'order_history.html') {
    loadOrderHistory();
  }

  if (currentPage === 'contact.html') {
    setupContactForm();
  }

  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      try {
        const response = await fetch('http://127.0.0.1:8000/api/users/login/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: email, password: password }),
        });
        const data = await response.json();
        if (response.ok) {
          sessionStorage.setItem('authToken', data.token);
          sessionStorage.setItem('isAuthenticated', 'true');
          sessionStorage.setItem('username', data.username);
          alert('Login successful!');
          window.location.href = 'index.html';
        } else {
          alert(`Login failed: ${data.error}`);
        }
      } catch (error) {
        alert('An error occurred during login.');
      }
    });
  }

  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const email = document.getElementById('register-email').value;
      const password = document.getElementById('register-password').value;
      const confirmPassword = document.getElementById('confirm-password').value;
      if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
      }
      try {
        const response = await fetch('http://127.0.0.1:8000/api/users/register/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: email, password: password }),
        });
        const data = await response.json();
        if (response.ok) {
          alert('Registration successful! You can now log in.');
          window.location.href = 'Login.html';
        } else {
          alert(`Registration failed: ${JSON.stringify(data)}`);
        }
      } catch (error) {
        alert('An error occurred during registration.');
      }
    });
  }

  const messageContainer = document.getElementById('message-container');
  if (messageContainer) {
    const urlParams = new URLSearchParams(window.location.search);
    const logoutSuccess = urlParams.get('logout');
    if (logoutSuccess === 'success') {
      const messageDiv = document.createElement('div');
      messageDiv.textContent = 'You have been logged out successfully.';
      messageDiv.classList.add('logout-message');
      messageContainer.appendChild(messageDiv);
      setTimeout(() => { messageDiv.remove(); }, 3000);
    }
  }
});