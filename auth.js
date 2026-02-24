import { supabase } from './supabase.js';

// DOM Elements
const authModal = document.getElementById('auth-modal');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const logoutBtn = document.getElementById('logout-btn');
const showLoginBtn = document.getElementById('show-login');
const showRegisterBtn = document.getElementById('show-register');
const closeModalBtn = document.getElementById('close-modal');
const tabBtns = document.querySelectorAll('.tab-btn');
const authMessage = document.getElementById('auth-message');

// Open Modal
function openModal(tab = 'login') {
    authModal.classList.add('active');
    switchTab(tab);
}

// Close Modal
function closeModal() {
    authModal.classList.remove('active');
    clearMessage();
}

// Switch between Login and Register tabs
function switchTab(tab) {
    tabBtns.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    
    if (tab === 'login') {
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
    } else {
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
    }
}

// Display message
function showMessage(message, isError = false) {
    authMessage.textContent = message;
    authMessage.className = `auth-message ${isError ? 'error' : 'success'}`;
}

function clearMessage() {
    authMessage.textContent = '';
    authMessage.className = 'auth-message';
}

// Register function
async function handleRegister(e) {
    e.preventDefault();
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    const { data, error } = await supabase.auth.signUp({
        email,
        password
    });

    if (error) {
        showMessage(error.message, true);
    } else {
        showMessage('Registration successful! Check your email to confirm.');
        registerForm.reset();
    }
}

// Login function
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        showMessage(error.message, true);
    } else {
        showMessage('Login successful!');
        closeModal();
    }
}

// Logout function
async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Logout error:', error.message);
    }
}

// Update UI based on auth state
function updateUI(user) {
    if (user) {
        // User is logged in
        showLoginBtn.style.display = 'none';
        showRegisterBtn.style.display = 'none';
        logoutBtn.style.display = 'inline-block';
    } else {
        // User is logged out
        showLoginBtn.style.display = 'inline-block';
        showRegisterBtn.style.display = 'inline-block';
        logoutBtn.style.display = 'none';
    }
}

// Auth State Change Listener
supabase.auth.onAuthStateChange((event, session) => {
    updateUI(session?.user ?? null);
});

// Check initial session
supabase.auth.getSession().then(({ data: { session } }) => {
    updateUI(session?.user ?? null);
});

// Event Listeners
showLoginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openModal('login');
});

showRegisterBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openModal('register');
});

closeModalBtn.addEventListener('click', closeModal);

authModal.addEventListener('click', (e) => {
    if (e.target === authModal) {
        closeModal();
    }
});

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

loginForm.addEventListener('submit', handleLogin);
registerForm.addEventListener('submit', handleRegister);
logoutBtn.addEventListener('click', handleLogout);
