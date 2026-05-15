document.addEventListener('DOMContentLoaded', () => {
    // Navbar Scroll Effect
    const navbar = document.getElementById('navbar');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile Navigation Toggle
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');

    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
    }

    // Close mobile nav when clicking a link
    const links = document.querySelectorAll('.nav-links a');
    links.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            navToggle.classList.remove('active');
        });
    });

    // Smooth Scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const navHeight = navbar.offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - navHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Scroll Reveal Animation using Intersection Observer
    const revealElements = document.querySelectorAll('.reveal');

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target); // Stop observing once revealed
            }
        });
    }, {
        root: null,
        threshold: 0.15, // Trigger when 15% of the element is visible
        rootMargin: "0px 0px -50px 0px"
    });

    revealElements.forEach(element => {
        revealObserver.observe(element);
    });

    // ==========================================
    // Order Overlay Logic
    // ==========================================
    const orderOverlay = document.getElementById('orderOverlay');
    const btnOpenOrders = document.querySelectorAll('.btn-open-order');
    const closeOrderOverlay = document.getElementById('closeOrderOverlay');

    btnOpenOrders.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent jump if href="#"
            if (orderOverlay) {
                orderOverlay.classList.add('active');
                document.body.style.overflow = 'hidden';
                // Close mobile nav if open
                if (document.getElementById('navLinks')) document.getElementById('navLinks').classList.remove('active');
                if (document.getElementById('navToggle')) document.getElementById('navToggle').classList.remove('active');
            }
        });
    });

    if (closeOrderOverlay) {
        closeOrderOverlay.addEventListener('click', () => {
            orderOverlay.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }

    // ==========================================
    // Order Builder Logic
    // ==========================================

    // Data
    const ALL_FLAVORS = {
        "Chocolates": ["Chocolate", "Chocolate al rhum", "Chocolate amargo", "Chocolate Blanco", "Chocolate Rocher", "Chocolate c/ almendras", "Chocolate Marroc"],
        "Mousses": ["Mousse de limon", "Mousse de chocolate", "Mosse de café al cognac", "Super Sambayon", "Super Sambayon c/almendras", "Don pedro"],
        "Dulce de Leche": ["Dulce de leche", "Dulce de leche c/ brownie", "Dulce de leche c/ nuez", "Dulce de leche granizado", "Dulce de leche oreo", "Super Dulce de leche"],
        "Frutas al agua": ["Ananá", "Durazno", "Frambuesa", "Frutilla", "Frutos del bosque", "Limón", "Maracuya", "Naranja"],
        "Cremas": ["Americana", "Banana", "Banana split", "Vainilla", "Cookies", "Coco", "Cereza", "Tramontana", "Granizado", "Flan", "Crema de almendras", "Pistacho", "Menta", "Tiramisu", "Kinotos", "Mantecol", "Higos c/nuez", "Frutilla a la reina", "Tarta de manzana", "Jengibre c/ miel"]
    };

    const state = {
        tubs: [],
        nextTubId: 1,
        activeTubIdForModal: null
    };

    // DOM Elements
    const tubsContainer = document.getElementById('tubs-container');
    const btnSizes = document.querySelectorAll('.btn-size');
    const totalPriceEl = document.getElementById('total-price');
    const btnSubmitOrder = document.getElementById('btn-submit-order');
    const orderForm = document.getElementById('order-form');

    // Modal Elements
    const flavorModal = document.getElementById('flavorModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const confirmFlavorsBtn = document.getElementById('confirmFlavorsBtn');
    const flavorsList = document.getElementById('flavorsList');
    const currentFlavorCountEl = document.getElementById('currentFlavorCount');
    const maxFlavorCountEl = document.getElementById('maxFlavorCount');

    // Generate Flavors HTML once
    function generateFlavorsHTML() {
        if (!flavorsList) return;
        let html = '';
        for (const [category, flavors] of Object.entries(ALL_FLAVORS)) {
            html += `
                <div class="flavor-category">
                    <h4>${category}</h4>
                    <div class="flavor-chips">
                        ${flavors.map(flavor => `<div class="flavor-chip" data-flavor="${flavor}">${flavor}</div>`).join('')}
                    </div>
                </div>
            `;
        }
        flavorsList.innerHTML = html;

        // Add event listeners to chips
        document.querySelectorAll('.flavor-chip').forEach(chip => {
            chip.addEventListener('click', () => toggleFlavor(chip));
        });
    }

    generateFlavorsHTML();

    // 1. Add Tub
    if (btnSizes) {
        btnSizes.forEach(btn => {
            btn.addEventListener('click', () => {
                const size = btn.getAttribute('data-size');
                const price = parseInt(btn.getAttribute('data-price'));
                const maxFlavors = parseInt(btn.getAttribute('data-max'));
                let sizeTitle = '';
                if (size === '1kg') sizeTitle = '1 KG';
                else if (size === '1/2kg') sizeTitle = '1/2 KG';
                else if (size === '1/4kg') sizeTitle = '1/4 KG';

                const newTub = {
                    id: state.nextTubId++,
                    sizeTitle: sizeTitle,
                    price: price,
                    maxFlavors: maxFlavors,
                    selectedFlavors: []
                };

                state.tubs.push(newTub);
                renderTubs();
                updateTotal();
                validateForm();
            });
        });
    }

    // 2. Render Tubs
    function renderTubs() {
        if (!tubsContainer) return;
        if (state.tubs.length === 0) {
            tubsContainer.innerHTML = `<div class="empty-cart-msg">Aún no agregaste ningún pote.</div>`;
            return;
        }

        tubsContainer.innerHTML = '';
        state.tubs.forEach(tub => {
            const tubEl = document.createElement('div');
            tubEl.className = 'tub-card';

            const flavorsHtml = tub.selectedFlavors.length > 0
                ? tub.selectedFlavors.map(f => `<span class="flavor-tag">${f}</span>`).join('')
                : '<span style="color:#999; font-size:0.9rem;">Sin sabores seleccionados</span>';

            tubEl.innerHTML = `
                <div class="tub-header">
                    <h4>Pote ${tub.sizeTitle} <span class="tub-price">$${tub.price.toLocaleString('es-AR')}</span></h4>
                    <button class="btn-remove-tub" onclick="removeTub(${tub.id})"><i class="fa-solid fa-trash"></i></button>
                </div>
                <div class="tub-flavors">
                    <p>Sabores seleccionados (${tub.selectedFlavors.length}/${tub.maxFlavors}):</p>
                    <div class="selected-flavors-tags" id="tags-${tub.id}">
                        ${flavorsHtml}
                    </div>
                    <button class="btn-select-flavors" onclick="openFlavorModal(${tub.id})">
                        ${tub.selectedFlavors.length > 0 ? 'Modificar sabores' : 'Elegir sabores'}
                    </button>
                </div>
            `;
            tubsContainer.appendChild(tubEl);
        });
    }

    // 3. Remove Tub
    window.removeTub = function (id) {
        state.tubs = state.tubs.filter(t => t.id !== id);
        renderTubs();
        updateTotal();
        validateForm();
    };

    // 4. Flavor Modal Logic
    window.openFlavorModal = function (id) {
        state.activeTubIdForModal = id;
        const tub = state.tubs.find(t => t.id === id);

        // Setup Modal UI
        maxFlavorCountEl.textContent = tub.maxFlavors;
        currentFlavorCountEl.textContent = tub.selectedFlavors.length;

        // Reset chips and mark selected ones
        document.querySelectorAll('.flavor-chip').forEach(chip => {
            const f = chip.getAttribute('data-flavor');
            chip.classList.remove('selected', 'disabled');
            if (tub.selectedFlavors.includes(f)) {
                chip.classList.add('selected');
            }
        });

        // Disable unselected if limit reached
        if (tub.selectedFlavors.length >= tub.maxFlavors) {
            document.querySelectorAll('.flavor-chip:not(.selected)').forEach(c => c.classList.add('disabled'));
        }

        flavorModal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    };

    function closeFlavorModal() {
        if (!flavorModal) return;
        flavorModal.classList.remove('active');
        document.body.style.overflow = 'auto';
        state.activeTubIdForModal = null;
    }

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeFlavorModal);
    if (confirmFlavorsBtn) confirmFlavorsBtn.addEventListener('click', closeFlavorModal);

    window.toggleFlavor = function (chip) {
        if (!state.activeTubIdForModal) return;
        const tub = state.tubs.find(t => t.id === state.activeTubIdForModal);
        const flavor = chip.getAttribute('data-flavor');
        const isSelected = chip.classList.contains('selected');

        if (isSelected) {
            // Remove flavor
            tub.selectedFlavors = tub.selectedFlavors.filter(f => f !== flavor);
            chip.classList.remove('selected');
        } else {
            // Add flavor (check limit)
            if (tub.selectedFlavors.length < tub.maxFlavors) {
                tub.selectedFlavors.push(flavor);
                chip.classList.add('selected');
            }
        }

        // Update counts
        currentFlavorCountEl.textContent = tub.selectedFlavors.length;

        // Update disabled state
        if (tub.selectedFlavors.length >= tub.maxFlavors) {
            document.querySelectorAll('.flavor-chip:not(.selected)').forEach(c => c.classList.add('disabled'));
        } else {
            document.querySelectorAll('.flavor-chip.disabled').forEach(c => c.classList.remove('disabled'));
        }

        // Auto re-render tubs behind modal to show changes
        renderTubs();
        validateForm();
    };

    // 5. Update Total
    function updateTotal() {
        if (!totalPriceEl) return;
        const total = state.tubs.reduce((acc, tub) => acc + tub.price, 0);
        totalPriceEl.textContent = `$${total.toLocaleString('es-AR')}`;
    }

    // Payment Method Logic
    const paymentMethodEl = document.getElementById('payment-method');
    const cashAmountGroup = document.getElementById('cash-amount-group');
    const cashAmountEl = document.getElementById('cash-amount');

    if (paymentMethodEl) {
        paymentMethodEl.addEventListener('change', () => {
            if (paymentMethodEl.value === 'Efectivo') {
                cashAmountGroup.style.display = 'flex';
            } else {
                cashAmountGroup.style.display = 'none';
                if (cashAmountEl) cashAmountEl.value = ''; // Reset value
            }
            validateForm();
        });
    }

    // 6. Form Validation & Submission
    window.validateForm = function () {
        if (!btnSubmitOrder) return;
        const nameEl = document.getElementById('client-name');
        const addressEl = document.getElementById('client-address');
        const phoneEl = document.getElementById('client-phone');

        if (!nameEl || !addressEl || !phoneEl) return;

        const name = nameEl.value.trim();
        const address = addressEl.value.trim();
        const phone = phoneEl.value.trim();

        let isValid = true;

        // Needs at least one tub
        if (state.tubs.length === 0) isValid = false;

        // All tubs need at least 1 flavor
        if (state.tubs.some(t => t.selectedFlavors.length === 0)) isValid = false;

        // Contact fields
        if (!name || !address || !phone) isValid = false;

        // Cash amount check
        if (paymentMethodEl && paymentMethodEl.value === 'Efectivo' && cashAmountEl) {
            const total = state.tubs.reduce((acc, tub) => acc + tub.price, 0);
            const cash = parseInt(cashAmountEl.value);
            if (isNaN(cash) || cash < total) {
                isValid = false;
            }
        }

        if (isValid) {
            btnSubmitOrder.classList.remove('disabled');
        } else {
            btnSubmitOrder.classList.add('disabled');
        }
    };

    // Add event listeners to form inputs
    const formInputs = document.querySelectorAll('#order-form input, #order-form select');
    formInputs.forEach(input => {
        input.addEventListener('input', validateForm);
        input.addEventListener('change', validateForm);
    });

    if (btnSubmitOrder) {
        btnSubmitOrder.addEventListener('click', () => {
            if (btnSubmitOrder.classList.contains('disabled')) return;

            // Gather data
            const name = document.getElementById('client-name').value.trim();
            const address = document.getElementById('client-address').value.trim();
            const phone = document.getElementById('client-phone').value.trim();
            const payment = document.getElementById('payment-method').value;

            const extrasArr = [];
            if (document.getElementById('extra-conitos').checked) extrasArr.push('Conitos');
            if (document.getElementById('extra-cucuruchos').checked) extrasArr.push('Cucuruchos');
            if (document.getElementById('extra-salsas').checked) extrasArr.push('Salsas');
            const extrasStr = extrasArr.length > 0 ? extrasArr.join(', ') : 'Ninguno';

            const total = state.tubs.reduce((acc, tub) => acc + tub.price, 0);

            // Build Message
            let msg = `*Nuevo Pedido - Filadelfia* 🍦\n`;
            msg += `--------------------------\n`;
            msg += `*Cliente:* ${name}\n`;
            msg += `*Dirección:* ${address}\n`;
            msg += `*Teléfono:* ${phone}\n`;
            msg += `*Pago:* ${payment}\n`;

            if (payment === 'Efectivo' && cashAmountEl) {
                const cash = parseInt(cashAmountEl.value);
                const vuelto = cash - total;
                msg += `*Abona con:* $${cash.toLocaleString('es-AR')} (Vuelto: $${vuelto.toLocaleString('es-AR')})\n`;
            }

            msg += `\n*Detalle:*\n`;
            state.tubs.forEach((tub, index) => {
                const fStr = tub.selectedFlavors.length > 0 ? tub.selectedFlavors.join(', ') : 'Sin sabores seleccionados';
                msg += `- Pote ${index + 1}: ${tub.sizeTitle} (${fStr})\n`;
            });

            msg += `\n*Extras:* ${extrasStr}\n`;
            msg += `*Envío:* ¡Gratis!\n`;
            msg += `*Total a pagar:* $${total.toLocaleString('es-AR')}`;

            // Send via WhatsApp
            const waNumber = '5491165197521';
            const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`;

            window.open(waUrl, '_blank');
        });
    }
});
