// =========================================
// SISTEMA DE PARTÍCULAS 3D (MAREAS DIGITALES)
// =========================================
const oceanContainer = document.getElementById('particle-ocean-container');

if (oceanContainer && typeof THREE !== 'undefined') {
    let scene, camera, renderer, particles;
    let mouseX = 0, mouseY = 0;

    const isMobile = window.innerWidth <= 768;
    const SEPARATION = isMobile ? 45 : 35;
    const AMOUNTX = isMobile ? 80 : 160;
    const AMOUNTY = isMobile ? 80 : 160;
    let count = 0;

    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    function init3DOcean() {
        scene = new THREE.Scene();

        // Cámara
        camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 1, 10000);
        // Posicionamiento para mirar la "marea" desde arriba en ángulo
        camera.position.z = isMobile ? 1500 : 1200;
        camera.position.y = 500;
        camera.lookAt(0, 0, 0);

        // Renderizador WebGL
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limitar para performance
        renderer.setSize(window.innerWidth, window.innerHeight);
        oceanContainer.appendChild(renderer.domElement);

        // Geometría y Partículas
        const geometry = new THREE.BufferGeometry();
        const numParticles = AMOUNTX * AMOUNTY;
        const positions = new Float32Array(numParticles * 3);
        const colors = new Float32Array(numParticles * 3);

        const colorBase = new THREE.Color(0x0077b6); // Azul profundo (Wimbi)
        const colorCrest = new THREE.Color(0x00e5ff); // Cyan eléctrico

        let i = 0;
        for (let ix = 0; ix < AMOUNTX; ix++) {
            for (let iy = 0; iy < AMOUNTY; iy++) {
                // Posición (X y Z plano horizontal)
                positions[i] = ix * SEPARATION - ((AMOUNTX * SEPARATION) / 2);
                positions[i + 1] = 0; // Altura Y será calculada en animar
                positions[i + 2] = iy * SEPARATION - ((AMOUNTY * SEPARATION) / 2);

                // Color preliminar
                colors[i] = colorBase.r;
                colors[i + 1] = colorBase.g;
                colors[i + 2] = colorBase.b;

                i += 3;
            }
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        // Material estilo "Pixel" (puntos cuadrados básicos pero de alta tecnología)
        const material = new THREE.PointsMaterial({
            size: isMobile ? 1.8 : 2.5,  // Más sutil en móvil
            vertexColors: true,     
            transparent: true,
            opacity: isMobile ? 0.6 : 0.9, // Más sutil en móvil
            sizeAttenuation: true   
        });

        particles = new THREE.Points(geometry, material);
        scene.add(particles);

        // Eventos
        document.addEventListener('mousemove', onOceanMouseMove, false);
        window.addEventListener('resize', onOceanResize, false);
    }

    function onOceanResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function onOceanMouseMove(event) {
        // Normalizar y suavizar rastreo del mouse
        mouseX = event.clientX - windowHalfX;
        mouseY = event.clientY - windowHalfY;
    }

    function animateOcean() {
        requestAnimationFrame(animateOcean);

        // Movimiento flotante de la cámara basado en el mouse
        camera.position.x += (mouseX * 0.4 - camera.position.x) * 0.05;
        camera.position.y += (-mouseY * 0.4 - camera.position.y + 500) * 0.05;
        camera.lookAt(scene.position);

        const positions = particles.geometry.attributes.position.array;
        const colors = particles.geometry.attributes.color.array;

        const colorBase = new THREE.Color(0x0077b6);
        const colorCrest = new THREE.Color(0x00e5ff);

        let i = 0;
        let ix, iy;

        // Cálculos de las olas (2 componentes sinusoidales percusivas)
        for (ix = 0; ix < AMOUNTX; ix++) {
            for (iy = 0; iy < AMOUNTY; iy++) {

                // Fórmula de marea matemática con variables dependientes del tiempo
                let waveY = (Math.sin((ix + count) * 0.3) * (isMobile ? 40 : 60)) +
                    (Math.sin((iy + count) * 0.4) * (isMobile ? 40 : 60));

                positions[i + 1] = waveY;

                // Color dinámico espacial
                let heightNormalized = (waveY + 120) / 240;
                heightNormalized = Math.max(0, Math.min(1, heightNormalized));

                // Interpolar color
                const pColor = colorBase.clone().lerp(colorCrest, heightNormalized * 1.5);

                colors[i] = pColor.r;
                colors[i + 1] = pColor.g;
                colors[i + 2] = pColor.b;

                i += 3;
            }
        }

        particles.geometry.attributes.position.needsUpdate = true;
        particles.geometry.attributes.color.needsUpdate = true;

        renderer.render(scene, camera);

        count += isMobile ? 0.02 : 0.04; // Velocidad del flujo oceánico (más lenta en móvil)
    }

    // Arrancar el motor 3D
    init3DOcean();
    animateOcean();
}

// =========================================
// SISTEMA DE REVELADO (SCROLL)

// =========================================
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');

            // Si tiene estadísticas, las animamos
            const stats = entry.target.querySelectorAll('.stat-number');
            if (stats.length > 0) {
                animateStats(stats);
            }
        }
    });
}, { threshold: 0.15 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// =========================================
// ANIMACIÓN DE ESTADÍSTICAS
// =========================================
function animateStats(stats) {
    stats.forEach(stat => {
        if (stat.classList.contains('animated')) return;
        stat.classList.add('animated');

        const target = parseInt(stat.getAttribute('data-count'));
        let count = 0;
        const duration = 2000;
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (easeOutExpo)
            const ease = 1 - Math.pow(2, -10 * progress);

            count = Math.floor(ease * target);
            stat.innerText = count;

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                stat.innerText = target;
            }
        }
        requestAnimationFrame(update);
    });
}



// =========================================
// MENÚ MÓVIL
// =========================================
const hamburger = document.querySelector('.hamburger');
const navMenu = document.getElementById('nav-menu');
const navLinksItems = document.querySelectorAll('.nav-links li');

if (hamburger) {
    hamburger.addEventListener('click', () => {
        const isActive = hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
        document.body.classList.toggle('menu-open', isActive);

        // Efecto cascada en links
        navLinksItems.forEach((link, index) => {
            if (navMenu.classList.contains('active')) {
                link.style.transitionDelay = `${0.1 + (index * 0.1)}s`;
            } else {
                link.style.transitionDelay = '0s';
            }
        });
    });

    // Cerrar menú al hacer clic en un enlace (excepto si es un dropdown en móvil)
    navLinksItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const isDropdown = item.classList.contains('dropdown');

            if (window.innerWidth <= 992 && isDropdown) {
                // En móvil, si clicamos en el dropdown, lo alternamos
                const link = item.querySelector('a');
                // Si el clic fue directamente en el enlace principal del dropdown
                if (e.target === link || link.contains(e.target)) {
                    // Si clicamos en un sub-enlace, sí queremos cerrar el menú
                    if (e.target.closest('.dropdown-menu')) {
                        hamburger.classList.remove('active');
                        navMenu.classList.remove('active');
                        document.body.classList.remove('menu-open');
                    } else {
                        // Si clicamos en el padre, prevenimos navegación y alternamos
                        e.preventDefault();
                        item.classList.toggle('active');
                    }
                }
            } else {
                // Comportamiento normal para links que no son dropdown
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.classList.remove('menu-open');
            }
        });
    });
}

// =========================================
// NAVEGACIÓN ACTIVA (PÁGINA Y SCROLL)
// =========================================
const navLinks = document.querySelectorAll('.nav-links a:not(.btn-primary)');
const currentPath = window.location.pathname.split('/').pop() || 'index.html';

function updateActiveNav() {
    const sections = document.querySelectorAll('section[id], header[id]');

    // 1. Lógica por Página (Astro-like persistent active)
    const currentPath = window.location.pathname;
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        
        // Si el link es una URL completa (usando home_url en PHP) o un slug
        if (href.includes('http') || href.startsWith('/')) {
            try {
                const url = new URL(href, window.location.origin);
                // Si el path coincide (o es la home)
                if (url.pathname === currentPath || (currentPath === '/' && url.pathname === '/')) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            } catch(e) {
                // Fallback para hrefs relativos simples
                if (currentPath.includes(href.replace('.html', ''))) {
                    link.classList.add('active');
                }
            }
        }
    });

    // 2. ScrollSpy (Solo si estamos en la Home o hay anclas locales)
    if (sections.length > 0) {
        const scrollSpyObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    navLinks.forEach(link => {
                        const href = link.getAttribute('href');
                        if (href === `#${id}` || href === `${currentPath}#${id}`) {
                            link.classList.add('active');
                        } else if (href.startsWith('#')) {
                            link.classList.remove('active');
                        }
                    });
                }
            });
        }, { threshold: 0.2, rootMargin: "-10% 0px -40% 0px" });

        sections.forEach(section => scrollSpyObserver.observe(section));
    }
}

updateActiveNav();

// =========================================
// SHRINK ON SCROLL (Header compacto)
// =========================================
const navbar = document.querySelector('.navbar');
if (navbar) {
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        if (currentScroll > 60) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        lastScroll = currentScroll;
    }, { passive: true });
}

// =========================================
// FORMULARIO DE CONTACTO (WHATSAPP REDIRECTION)
// =========================================
const contactForm = document.getElementById('contact-form-universal');
const packButtons = document.querySelectorAll('.pack-cta');
let selectedPack = "";

// Al hacer clic en un pack, guardamos cuál fue
packButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        selectedPack = btn.getAttribute('data-pack');
        // Opcional: Desplazar suavemente (ya lo hace el href="#contacto")
        // Podríamos pre-seleccionar algo en el select si fuera necesario
    });
});

if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        // Datos del formulario
        const nombre = document.getElementById('nombre_uni').value;
        const telefono = document.getElementById('contacto_user_uni').value;
        const email = document.getElementById('email_uni').value;
        const servicio = document.getElementById('servicio_uni').value;
        const nota = document.getElementById('nota_uni').value;

        // Estado de carga visual
        submitBtn.classList.add('btn-loading');
        submitBtn.innerHTML = '<span>Redirigiendo a WhatsApp...</span>';

        // Construir Mensaje
        let msg = `Hola Wimbi! 👋\n\n`;
        msg += `Me interesa iniciar un proyecto.\n`;
        msg += `*Nombre:* ${nombre}\n`;
        msg += `*Teléfono:* ${telefono}\n`;
        msg += `*Email:* ${email}\n`;
        msg += `*Servicio/Interés:* ${selectedPack || servicio}\n`;
        msg += `*Detalles:* ${nota}`;

        const whatsappUrl = `https://wa.me/584241550550?text=${encodeURIComponent(msg)}`;

        // Simular un breve retraso para feedback UX
        setTimeout(() => {
            submitBtn.classList.remove('btn-loading');
            submitBtn.innerHTML = originalText;
            
            // Redirigir a WhatsApp
            window.open(whatsappUrl, '_blank');
            
            // Limpiar formulario y pack seleccionado
            contactForm.reset();
            selectedPack = "";
        }, 800);
    });
}

// =========================================
// FORMULARIO MINI - PORTAFOLIO (INTERACCIÓN)
// =========================================
const portfolioContactForm = document.getElementById('portfolio-contact-form');
if (portfolioContactForm) {
    // Crear elemento de mensaje de éxito dinámicamente
    const portfolioSuccessMsg = document.createElement('div');
    portfolioSuccessMsg.className = 'form-success-msg';
    portfolioSuccessMsg.innerHTML = '¡El mensaje está en camino! 🌊<br>Nos contactaremos contigo para trazar tu nueva hoja de ruta digital.';
    portfolioContactForm.appendChild(portfolioSuccessMsg);

    portfolioContactForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Prevenir recarga de página

        const submitBtn = portfolioContactForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        // Estado de carga
        submitBtn.classList.add('mini-btn-loading');
        submitBtn.innerHTML = '<span>Enviando...</span>';

        // Simular envío (asíncrono)
        setTimeout(() => {
            submitBtn.classList.remove('mini-btn-loading');
            submitBtn.innerHTML = originalText;

            // Ocultar campos y botón
            const formGroups = portfolioContactForm.querySelectorAll('.mini-form-group, .mini-form-actions');
            formGroups.forEach(group => group.style.display = 'none');
            submitBtn.style.display = 'none';

            // Mostrar mensaje de éxito
            portfolioSuccessMsg.style.display = 'block';
        }, 1500); // 1.5s simulación
    });
}

// =========================================
// INTERACTIVE SOLUTIONS CAROUSEL (IA CONTENT)
// =========================================
// =========================================
// WIMBI CAROUSEL SYSTEM (Con animación de Amago/Pulse)
// =========================================
class WimbiCarousel {
    constructor(element) {
        this.wrapper = element;
        this.track = element.querySelector('.carousel-track');
        this.items = element.querySelectorAll('.carousel-item');
        this.prevBtn = element.querySelector('.carousel-btn.prev');
        this.nextBtn = element.querySelector('.carousel-btn.next');
        this.dotsNav = element.querySelector('.carousel-dots');

        this.currentIndex = 0;
        this.gap = 24; // 1.5rem
        this.isAnimating = false;

        this.init();
    }

    init() {
        if (!this.track || this.items.length === 0) return;

        this.updateItemsPerView();
        this.createDots();
        this.addEventListeners();
        this.startAutoPlay();

        // Inicializar posición
        this.updateCarousel(false);
    }

    updateItemsPerView() {
        this.itemsPerView = window.innerWidth > 1024 ? 3 : (window.innerWidth > 768 ? 2 : 1);
    }

    createDots() {
        if (!this.dotsNav) return;
        this.dotsNav.innerHTML = '';
        const numDots = Math.max(0, this.items.length - this.itemsPerView + 1);

        for (let i = 0; i < numDots; i++) {
            const dot = document.createElement('div');
            dot.className = i === 0 ? 'dot active' : 'dot';
            dot.dataset.index = i;
            this.dotsNav.appendChild(dot);
        }
        this.dots = this.dotsNav.querySelectorAll('.dot');
    }

    addEventListeners() {
        this.nextBtn?.addEventListener('click', () => this.next());
        this.prevBtn?.addEventListener('click', () => this.prev());

        this.dots?.forEach(dot => {
            dot.addEventListener('click', (e) => {
                this.currentIndex = parseInt(e.target.dataset.index);
                this.updateCarousel();
            });
        });

        window.addEventListener('resize', () => {
            const oldView = this.itemsPerView;
            this.updateItemsPerView();
            if (oldView !== this.itemsPerView) this.createDots();
            this.updateCarousel(false);
        });

        this.wrapper.addEventListener('mouseenter', () => this.stopAutoPlay());
        this.wrapper.addEventListener('mouseleave', () => this.startAutoPlay());
    }

    next() {
        if (this.isAnimating) return;
        const maxIndex = this.items.length - this.itemsPerView;
        const nextIndex = this.currentIndex < maxIndex ? this.currentIndex + 1 : 0;
        this.triggerPulseAndSlide(nextIndex, 'next');
    }

    prev() {
        if (this.isAnimating) return;
        const maxIndex = this.items.length - this.itemsPerView;
        const nextIndex = this.currentIndex > 0 ? this.currentIndex - 1 : maxIndex;
        this.triggerPulseAndSlide(nextIndex, 'prev');
    }

    triggerPulseAndSlide(nextIndex, direction) {
        this.isAnimating = true;

        // Fase 1: El Amago (Pulse) - Más rápido (200ms)
        const pulseAmount = direction === 'next' ? 40 : -40;
        const itemWidth = this.items[0].getBoundingClientRect().width;
        const currentPos = - (itemWidth + this.gap) * this.currentIndex;

        this.track.style.transition = 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        this.track.style.transform = `translateX(${currentPos - pulseAmount}px)`;

        // Fase 2: El Desplazamiento Real - Más rápido (400ms)
        setTimeout(() => {
            this.currentIndex = nextIndex;
            this.track.style.transition = 'transform 0.4s cubic-bezier(0.645, 0.045, 0.355, 1)';
            this.updateCarousel();

            setTimeout(() => {
                this.isAnimating = false;
            }, 400);
        }, 200);
    }

    updateCarousel(animate = true) {
        const itemWidth = this.items[0].getBoundingClientRect().width;
        const moveDistance = (itemWidth + this.gap) * this.currentIndex;

        if (!animate) this.track.style.transition = 'none';
        this.track.style.transform = `translateX(-${moveDistance}px)`;

        // Actualizar dots
        this.dots?.forEach((dot, i) => {
            dot.classList.toggle('active', i === this.currentIndex);
        });
    }

    startAutoPlay() {
        // Intervalo más frecuente: 3.5 segundos
        this.autoPlayInterval = setInterval(() => this.next(), 3500);
    }

    stopAutoPlay() {
        clearInterval(this.autoPlayInterval);
    }
}

// Inicializar todos los carruseles y efectos de scroll al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
    // Carruseles
    document.querySelectorAll('.carousel-wrapper').forEach(el => new WimbiCarousel(el));

    // Revelación al scroll (Intersection Observer)
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
});

// Parallax effect for the 3D Ocean Mask Banner (Panoramic Wave)
window.addEventListener('scroll', () => {
    const waveBanner = document.querySelector('.about-banner-wave');
    if (waveBanner) {
        const rect = waveBanner.getBoundingClientRect();
        const winHeight = window.innerHeight;

        if (rect.top < winHeight && rect.bottom > 0) {
            const progress = 1 - (rect.bottom / (winHeight + rect.height));
            const moveX = 50 + (progress - 0.5) * 60;
            waveBanner.style.maskPosition = `${moveX}% 0`;
            waveBanner.style.webkitMaskPosition = `${moveX}% 0`;
            const scaleY = 1 + Math.sin(progress * Math.PI) * 0.1;
            waveBanner.style.transform = `scaleY(${scaleY})`;
        }
    }
});

// =========================================
// LUNA CHATBOT PIXEL ANIMATION (NO-CORS VERSION)
// =========================================
document.addEventListener('DOMContentLoaded', () => {


    // --- Lógica de Portafolio Real (Rumi) ---

    // 1. Slider Automático para la tarjeta de Rumi
    const rumiSlider = document.getElementById('rumi-slider');
    if (rumiSlider) {
        const images = rumiSlider.querySelectorAll('.slider-img');
        const dots = rumiSlider.querySelectorAll('.dot');
        let currentImg = 0;

        setInterval(() => {
            // Quitar activa de la actual
            images[currentImg].classList.remove('active');
            dots[currentImg].classList.remove('active');

            // Siguiente
            currentImg = (currentImg + 1) % images.length;

            // Poner activa en la siguiente
            images[currentImg].classList.add('active');
            dots[currentImg].classList.add('active');
        }, 4000); // Cambia cada 4 segundos
    }

    // 2. Lógica de Modales (Vista Extendida)
    const openModalBtns = document.querySelectorAll('.open-modal');
    const modals = document.querySelectorAll('.portfolio-modal');
    const closeBtns = document.querySelectorAll('.modal-close');
    const modalOverlays = document.querySelectorAll('.modal-overlay');

    openModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.getAttribute('data-target');
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.add('active');
                document.body.style.overflow = 'hidden'; // Evitar scroll al fondo
            }
        });
    });

    const closeModal = () => {
        modals.forEach(m => m.classList.remove('active'));
        document.body.style.overflow = ''; // Restaurar scroll
    };

    closeBtns.forEach(btn => btn.addEventListener('click', closeModal));
    modalOverlays.forEach(overlay => overlay.addEventListener('click', closeModal));

    // Cerrar con Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });

    // =========================================
    // LUNA WHATSAPP NOTIFICATION TRIGGER (40s)
    // =========================================
    setTimeout(() => {
        const lunaBubble = document.querySelector('.luna-bubble');
        if (lunaBubble) {
            lunaBubble.classList.add('active');
            
            // Sonido de notificación opcional (muy sutil)
            // console.log("Luna: ¿Necesitas ayuda con tu automatización?");
        }
    }, 40000); // 40 Segundos
});

