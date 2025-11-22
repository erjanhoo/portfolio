document.addEventListener('DOMContentLoaded', () => {
    const themeButton = document.getElementById('theme-switch-button');
    const navToggle = document.getElementById('nav-toggle');
    const navList = document.getElementById('primary-navigation');
    const navLinks = navList ? Array.from(navList.querySelectorAll('a')) : [];
    const sectionElements = Array.from(document.querySelectorAll('[data-section]'));
    const revealElements = Array.from(document.querySelectorAll('[data-reveal]'));
    const progressBar = document.getElementById('scroll-progress');
    const scrollTopButton = document.querySelector('.scroll-top');

    const sendButton = document.querySelector('.send-button');
    const formInputs = Array.from(document.querySelectorAll('.form-container .form-input[data-validate]'));
    const toastStack = document.getElementById('toast-stack');
    const contactLink = document.querySelector('.contact-link');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const scrollState = {
        ticking: false
    };

    function loadThemePreference() {
        if (!themeButton) return;

        const savedTheme = localStorage.getItem('theme');
        const shouldUseLight = savedTheme === 'light';
        document.body.classList.toggle('light-theme', shouldUseLight);
        const buttonLabel = shouldUseLight ? 'Dark' : 'Light';
        themeButton.textContent = buttonLabel;
        themeButton.setAttribute('aria-pressed', shouldUseLight ? 'true' : 'false');
        themeButton.setAttribute('aria-label', shouldUseLight ? 'Switch to dark theme' : 'Switch to light theme');
    }

    function toggleTheme() {
        if (!themeButton) return;

        const body = document.body;
        const useLightTheme = !body.classList.contains('light-theme');
        body.classList.toggle('light-theme', useLightTheme);
        themeButton.textContent = useLightTheme ? 'Dark' : 'Light';
        themeButton.setAttribute('aria-pressed', useLightTheme ? 'true' : 'false');
        themeButton.setAttribute('aria-label', useLightTheme ? 'Switch to dark theme' : 'Switch to light theme');
        localStorage.setItem('theme', useLightTheme ? 'light' : 'dark');
    }

    function smoothScrollTo(targetId) {
        const targetElement = document.getElementById(targetId);
        if (!targetElement) return;

        const navbarHeight = document.querySelector('.navbar-container')?.offsetHeight || 60;
        const offset = window.innerWidth <= 768 ? navbarHeight + 10 : navbarHeight + 20;
        const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - offset;

        window.scrollTo({
            top: targetPosition,
            behavior: prefersReducedMotion ? 'auto' : 'smooth'
        });
    }

    function setupNavigation() {
        if (!navLinks.length) return;

        navLinks.forEach(link => {
            link.addEventListener('click', event => {
                const href = link.getAttribute('href');
                if (href && href.startsWith('#')) {
                    event.preventDefault();
                    const targetId = href.substring(1);
                    if (targetId === 'home') {
                        window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
                    } else {
                        smoothScrollTo(targetId);
                    }
                }

                if (navList && navList.classList.contains('open')) {
                    navList.classList.remove('open');
                    if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
                }
            });
        });
    }

    function setupContactLink() {
        if (!contactLink) return;

        contactLink.addEventListener('click', event => {
            event.preventDefault();
            smoothScrollTo('contact-me');
        });
    }

    function updateScrollProgress() {
        if (!progressBar) return;

        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrolled = scrollHeight <= 0 ? 0 : window.scrollY / scrollHeight;
        progressBar.style.transform = `scaleX(${Math.min(Math.max(scrolled, 0), 1)})`;
    }

    function highlightNavigation() {
        if (!navLinks.length || !sectionElements.length) return;

        const scrollPosition = window.scrollY + (document.querySelector('.navbar-container')?.offsetHeight || 60) + 20;
        let activeId = sectionElements[0].id || sectionElements[0].dataset.section;

        sectionElements.forEach(section => {
            const sectionTop = section.offsetTop;
            if (scrollPosition >= sectionTop) {
                activeId = section.id || section.dataset.section;
            }
        });

        navLinks.forEach(link => {
            const targetId = link.getAttribute('href')?.replace('#', '');
            link.classList.toggle('is-active', targetId === activeId);
        });
    }

    function toggleScrollTopButton() {
        if (!scrollTopButton) return;

        const shouldShow = window.scrollY > 420;
        scrollTopButton.classList.toggle('is-visible', shouldShow);
    }

    function handleScroll() {
        if (scrollState.ticking) return;

        scrollState.ticking = true;
        window.requestAnimationFrame(() => {
            updateScrollProgress();
            highlightNavigation();
            toggleScrollTopButton();
            scrollState.ticking = false;
        });
    }

    function initializeRevealObserver() {
        if (!revealElements.length) return;

        revealElements.forEach(element => {
            element.classList.add('reveal');
        });

        if (prefersReducedMotion || !('IntersectionObserver' in window)) {
            revealElements.forEach(element => element.classList.add('is-visible'));
            return;
        }

        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            root: null,
            threshold: 0.15,
            rootMargin: '0px 0px -80px 0px'
        });

        revealElements.forEach(element => observer.observe(element));
    }



    function createRipple(event) {
        const button = event.currentTarget;
        if (!button) return;

        const existingRipple = button.querySelector('.button-ripple');
        if (existingRipple) {
            existingRipple.remove();
        }

        const diameter = Math.max(button.clientWidth, button.clientHeight);
        const radius = diameter / 2;
        const rect = button.getBoundingClientRect();
        const offsetX = typeof event.offsetX === 'number' ? event.offsetX : rect.width / 2;
        const offsetY = typeof event.offsetY === 'number' ? event.offsetY : rect.height / 2;

        const ripple = document.createElement('span');
        ripple.classList.add('button-ripple');
        ripple.style.width = `${diameter}px`;
        ripple.style.height = `${diameter}px`;
        ripple.style.left = `${offsetX - radius}px`;
        ripple.style.top = `${offsetY - radius}px`;

        button.appendChild(ripple);

        ripple.addEventListener('animationend', () => {
            ripple.remove();
        }, { once: true });
    }

    function showToast(message, type = 'success') {
        if (!toastStack) {
            alert(message);
            return;
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icon = type === 'success'
            ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 13L9 17L19 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
            : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 8V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="16" r="0.75" fill="currentColor"/><path d="M3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

        toast.innerHTML = `<div class="toast-content">${icon}<span>${message}</span></div>`;
        toastStack.appendChild(toast);

        const removalDelay = 4200;
        setTimeout(() => {
            toast.classList.add('is-hidden');
            toast.addEventListener('animationend', () => toast.remove(), { once: true });
            toast.addEventListener('transitionend', () => toast.remove(), { once: true });
        }, removalDelay);

        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, removalDelay + 400);
    }

    function validateFields() {
        const values = {};
        let hasError = false;
        const errors = [];

        formInputs.forEach(input => {
            const key = input.dataset.validate;
            const value = input.value.trim();
            values[key] = value;

            if (!value) {
                hasError = true;
                errors.push('Please fill out all fields.');
            }
        });

        if (hasError) {
            return { isValid: false, values, errors: Array.from(new Set(errors)) };
        }

        const emailValue = values.email;
        const emailPattern = /^[\w.!#$%&'*+/=?^`{|}~-]+@[\w-]+(?:\.[\w-]+)+$/;
        if (!emailPattern.test(emailValue)) {
            return {
                isValid: false,
                values,
                errors: ['Please enter a valid email address.']
            };
        }

        if (values.message.length < 12) {
            return {
                isValid: false,
                values,
                errors: ['Your message should be at least 12 characters long.']
            };
        }

        return { isValid: true, values, errors: [] };
    }

    function handleContactSubmit(event) {
        if (!sendButton) return;

        event.preventDefault();
        const { isValid, values, errors } = validateFields();

        if (!isValid) {
            errors.forEach(message => showToast(message, 'error'));
            return;
        }

        showToast(`Здравствуйте ${values.text}! Ваше сообщение отправлено!`, 'success');

        formInputs.forEach(input => {
            input.value = '';
        });
    }

    function initializeContactForm() {
        if (!sendButton) return;

        sendButton.addEventListener('click', event => {
            createRipple(event);
            handleContactSubmit(event);
        });

        formInputs.forEach(input => {
            input.addEventListener('keydown', event => {
                if (event.key === 'Enter' && input !== formInputs[formInputs.length - 1]) {
                    event.preventDefault();
                    const nextIndex = formInputs.indexOf(input) + 1;
                    const nextInput = formInputs[nextIndex];
                    if (nextInput) {
                        nextInput.focus();
                    }
                }
            });
        });
    }

    function initializeScrollTop() {
        if (!scrollTopButton) return;

        scrollTopButton.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
        });
    }

    function initializeNavigationToggle() {
        if (!navToggle || !navList) return;

        const overlay = document.getElementById('mobile-menu-overlay');

        function closeMenu() {
            navList.classList.remove('open');
            navToggle.setAttribute('aria-expanded', 'false');
            if (overlay) overlay.classList.remove('active');
            document.body.style.overflow = '';
        }

        function openMenu() {
            navList.classList.add('open');
            navToggle.setAttribute('aria-expanded', 'true');
            if (overlay) overlay.classList.add('active');
        }

        navToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = navList.classList.contains('open');
            if (isOpen) {
                closeMenu();
            } else {
                openMenu();
            }
        });

        if (overlay) {
            overlay.addEventListener('click', closeMenu);
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navList.classList.contains('open')) {
                closeMenu();
            }
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && navList.classList.contains('open')) {
                closeMenu();
            }
        });
    }

    if (themeButton) {
        themeButton.addEventListener('click', toggleTheme);
        loadThemePreference();
    }

    initializeNavigationToggle();
    setupNavigation();
    setupContactLink();
    initializeRevealObserver();
    initializeContactForm();
    initializeScrollTop();
    highlightNavigation();
    updateScrollProgress();
    toggleScrollTopButton();

    window.addEventListener('scroll', handleScroll, { passive: true });
});