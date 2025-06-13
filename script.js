document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const cartIcon = document.querySelector('.cart-icon');
    const cartOverlay = document.querySelector('.cart-overlay');
    const closeCart = document.querySelector('.close-cart');
    const cartContent = document.querySelector('.cart-content');
    const totalPrice = document.querySelector('.total-price');
    const cartCount = document.querySelector('.cart-count');
    const addToCartBtns = document.querySelectorAll('.add-to-cart');
    const checkoutBtn = document.querySelector('.checkout-btn');
    const contactForm = document.getElementById('contact-form');
    const formMessage = document.getElementById('form-message');
    const menuMobile = document.querySelector('.menu-mobile');
    const navMenu = document.querySelector('nav ul');
    const signupModal = document.getElementById('signup-modal');
    const loginModal = document.getElementById('login-modal');
    const signupForm = document.getElementById('signup-form');
    const loginForm = document.getElementById('login-form');
    const closeModals = document.querySelectorAll('.close-modal');
    
    // Banco de dados simulados
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    let users = JSON.parse(localStorage.getItem('users')) || [];
    let orders = JSON.parse(localStorage.getItem('orders')) || [];
    
    // Produtos
    const products = [
        { id: '1', name: 'Água Mineral 500ml', price: 2.50, image: 'assets/produtos/agua-mineral.jpg' },
        { id: '2', name: 'Água com Gás 1L', price: 4.90, image: 'assets/produtos/agua-gas.jpg' },
        { id: '3', name: 'Água Alcalina 500ml', price: 5.90, image: 'assets/produtos/agua-alcalina.jpg' }
    ];
    
    // Inicialização
    initDB();
    updateCart();
    updateUserUI();
    
    // Funções do banco de dados
    function initDB() {
        if (!localStorage.getItem('users')) {
            localStorage.setItem('users', JSON.stringify([]));
        }
        if (!localStorage.getItem('orders')) {
            localStorage.setItem('orders', JSON.stringify([]));
        }
    }
    
    function createUser(name, email, password) {
        const user = {
            id: Date.now().toString(),
            name,
            email,
            password, // Em produção, isso deveria ser hasheado
            createdAt: new Date().toISOString()
        };
        users.push(user);
        localStorage.setItem('users', JSON.stringify(users));
        return user;
    }
    
    function findUserByEmail(email) {
        return users.find(user => user.email === email);
    }
    
    function createOrder(userId, items, total) {
        const order = {
            id: Date.now().toString(),
            userId,
            items: items.map(item => {
                const product = products.find(p => p.id === item.id);
                return {
                    productId: item.id,
                    name: product.name,
                    price: product.price,
                    quantity: item.quantity,
                    image: product.image
                };
            }),
            total,
            date: new Date().toISOString(),
            status: 'completed'
        };
        orders.push(order);
        localStorage.setItem('orders', JSON.stringify(orders));
        return order;
    }
    
    function getOrdersByUser(userId) {
        return orders.filter(order => order.userId === userId);
    }
    
    // Funções do carrinho (mantidas como antes)
    function updateCart() {
        localStorage.setItem('cart', JSON.stringify(cart));
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        cartCount.textContent = totalItems;
        const total = cart.reduce((sum, item) => {
            const product = products.find(p => p.id === item.id);
            return sum + (product.price * item.quantity);
        }, 0);
        totalPrice.textContent = `R$ ${total.toFixed(2)}`;
        renderCartItems();
    }
    
    function renderCartItems() {
        if (cart.length === 0) {
            cartContent.innerHTML = '<p class="empty-cart">Seu carrinho está vazio</p>';
            return;
        }
        
        cartContent.innerHTML = '';
        cart.forEach(item => {
            const product = products.find(p => p.id === item.id);
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <img src="${product.image}" alt="${product.name}">
                <div class="cart-item-info">
                    <h4>${product.name}</h4>
                    <p>R$ ${product.price.toFixed(2)}</p>
                    <div class="quantity-controls">
                        <button class="decrease" data-id="${item.id}">-</button>
                        <span>${item.quantity}</span>
                        <button class="increase" data-id="${item.id}">+</button>
                    </div>
                </div>
                <button class="cart-item-remove" data-id="${item.id}">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            cartContent.appendChild(cartItem);
        });
        
        document.querySelectorAll('.decrease').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                changeQuantity(id, -1);
            });
        });
        
        document.querySelectorAll('.increase').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                changeQuantity(id, 1);
            });
        });
        
        document.querySelectorAll('.cart-item-remove').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                removeItem(id);
            });
        });
    }
    
    function changeQuantity(id, change) {
        const item = cart.find(item => item.id === id);
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                cart = cart.filter(item => item.id !== id);
            }
            updateCart();
        }
    }
    
    function removeItem(id) {
        cart = cart.filter(item => item.id !== id);
        updateCart();
    }
    
    // Funções de usuário
    function updateUserUI() {
        const userArea = document.querySelector('.user-area');
        if (currentUser) {
            // Remove o ícone de carrinho se já existir um avatar
            if (!document.querySelector('.user-avatar')) {
                const cartIcon = userArea.querySelector('.cart-icon');
                if (cartIcon) cartIcon.style.marginRight = '15px';
                
                const userAvatar = document.createElement('div');
                userAvatar.className = 'user-avatar';
                userAvatar.textContent = currentUser.name.charAt(0).toUpperCase();
                userAvatar.title = currentUser.name;
                userArea.insertBefore(userAvatar, userArea.firstChild);
                
                userAvatar.addEventListener('click', function() {
                    window.location.href = '#pedidos';
                    loadOrdersPage();
                });
            }
        } else {
            const userAvatar = document.querySelector('.user-avatar');
            if (userAvatar) userAvatar.remove();
        }
    }
    
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }
    
    // Funções da página de pedidos
    function loadOrdersPage() {
        if (!currentUser) {
            window.location.href = '#inicio';
            return;
        }
        
        const main = document.querySelector('main');
        main.innerHTML = `
            <section id="pedidos" class="orders-section">
                <div class="container">
                    <h2>Meus Pedidos</h2>
                    <div id="orders-list" class="orders-list">
                        ${renderOrdersList()}
                    </div>
                    <a href="#produtos" class="btn" style="margin-top: 30px;">Continuar Comprando</a>
                </div>
            </section>
        `;
    }
    
    function renderOrdersList() {
        const userOrders = getOrdersByUser(currentUser.id);
        if (userOrders.length === 0) {
            return '<p>Você ainda não fez nenhum pedido.</p>';
        }
        
        return userOrders.map(order => `
            <div class="order-card">
                <img src="${order.items[0].image}" alt="${order.items[0].name}" class="order-image">
                <div class="order-details">
                    <h3>Pedido #${order.id.substr(-6)}</h3>
                    <p class="order-date">${new Date(order.date).toLocaleDateString()}</p>
                    <p>${order.items.length} item(s) - Total: R$ ${order.total.toFixed(2)}</p>
                    <p>Status: ${order.status === 'completed' ? 'Concluído' : 'Processando'}</p>
                </div>
            </div>
        `).join('');
    }
    
    // Event Listeners
    addToCartBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            const existingItem = cart.find(item => item.id === id);
            
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push({ id, quantity: 1 });
            }
            
            this.textContent = 'Adicionado!';
            setTimeout(() => {
                this.textContent = 'Adicionar';
            }, 1000);
            
            updateCart();
        });
    });
    
    checkoutBtn.addEventListener('click', function() {
        if (cart.length === 0) {
            showNotification('Seu carrinho está vazio!', 'error');
            return;
        }
        
        if (currentUser) {
            // Usuário logado - finalizar compra
            const total = cart.reduce((sum, item) => {
                const product = products.find(p => p.id === item.id);
                return sum + (product.price * item.quantity);
            }, 0);
            
            createOrder(currentUser.id, cart, total);
            showNotification('Compra efetuada com sucesso!');
            cart = [];
            updateCart();
            closeCart.click();
            
            // Atualiza a página de pedidos se estiver visível
            if (window.location.hash === '#pedidos') {
                loadOrdersPage();
            }
        } else {
            // Usuário não logado - pedir cadastro
            signupModal.style.display = 'block';
            cartOverlay.style.display = 'none';
        }
    });
    
    signupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        
        if (findUserByEmail(email)) {
            showNotification('Este e-mail já está cadastrado.', 'error');
            return;
        }
        
        currentUser = createUser(name, email, password);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        updateUserUI();
        
        // Finalizar a compra após cadastro
        const total = cart.reduce((sum, item) => {
            const product = products.find(p => p.id === item.id);
            return sum + (product.price * item.quantity);
        }, 0);
        
        createOrder(currentUser.id, cart, total);
        showNotification('Cadastro realizado e compra efetuada com sucesso!');
        
        cart = [];
        updateCart();
        signupModal.style.display = 'none';
        this.reset();
    });
    
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        const user = findUserByEmail(email);
        if (!user || user.password !== password) {
            showNotification('E-mail ou senha incorretos.', 'error');
            return;
        }
        
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        updateUserUI();
        showNotification('Login realizado com sucesso!');
        
        loginModal.style.display = 'none';
        this.reset();
        
        // Finalizar a compra após login
        const total = cart.reduce((sum, item) => {
            const product = products.find(p => p.id === item.id);
            return sum + (product.price * item.quantity);
        }, 0);
        
        createOrder(currentUser.id, cart, total);
        showNotification('Compra efetuada com sucesso!');
        
        cart = [];
        updateCart();
    });
    
    closeModals.forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
    
    window.addEventListener('click', function(e) {
        if (e.target === signupModal) signupModal.style.display = 'none';
        if (e.target === loginModal) loginModal.style.display = 'none';
    });
    
    // Menu mobile
    menuMobile.addEventListener('click', function() {
        navMenu.classList.toggle('active');
    });
    
    // Abrir/fechar carrinho
    cartIcon.addEventListener('click', function() {
        cartOverlay.style.display = 'flex';
    });
    
    closeCart.addEventListener('click', function() {
        cartOverlay.style.display = 'none';
    });
    
    cartOverlay.addEventListener('click', function(e) {
        if (e.target === cartOverlay) {
            cartOverlay.style.display = 'none';
        }
    });
    
    // Navegação por hash
    window.addEventListener('hashchange', function() {
        if (window.location.hash === '#pedidos') {
            loadOrdersPage();
        }
    });
    
    // Formulário de contato
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        setTimeout(() => {
            formMessage.textContent = 'Mensagem enviada com sucesso! Entraremos em contato em breve.';
            formMessage.className = 'form-message success';
            this.reset();
            
            setTimeout(() => {
                formMessage.style.display = 'none';
            }, 5000);
        }, 1000);
    });
});