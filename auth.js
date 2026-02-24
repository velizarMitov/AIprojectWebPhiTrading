import { supabase } from './supabase.js';

// DOM Elements
const authModal = document.getElementById('auth-modal');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const logoutBtn = document.getElementById('logout-btn');
const showLoginBtn = document.getElementById('show-login');
const showRegisterBtn = document.getElementById('show-register');
const adminPanelBtn = document.getElementById('admin-panel-btn');
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
    const selectedTier = document.getElementById('tier-select').value;

    const { data, error } = await supabase.auth.signUp({
        email,
        password
    });

    if (error) {
        showMessage(error.message, true);
        console.error('Signup error:', error);
        return;
    }

    // Insert profile data into profiles table
    if (data.user) {
        const { error: profileError } = await supabase
            .from('profiles')
            .insert([{ 
                id: data.user.id, 
                tier: selectedTier, 
                role: 'user' 
            }]);

        if (profileError) {
            console.error('Profile creation error:', profileError);
            showMessage('Account created but profile setup failed: ' + profileError.message, true);
        } else {
            console.log('Profile created successfully for user:', data.user.id);
            showMessage('Registration successful! Check your email to confirm.');
            registerForm.reset();
        }
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
    // Clear localStorage
    localStorage.removeItem('userRole');
    localStorage.removeItem('userTier');
}

// Update UI based on auth state
async function updateUI(user) {
    if (user) {
        // User is logged in
        showLoginBtn.style.display = 'none';
        showRegisterBtn.style.display = 'none';
        logoutBtn.style.display = 'inline-block';

        // Fetch user profile data
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('role, tier')
            .eq('id', user.id)
            .single();

        if (error) {
            console.error('Error fetching profile:', error);
        } else if (profile) {
            // Save to localStorage
            localStorage.setItem('userRole', profile.role);
            localStorage.setItem('userTier', profile.tier);
            
            console.log('User Role:', profile.role);
            console.log('User Tier:', profile.tier);

            // Show admin panel if user is admin
            if (profile.role === 'admin') {
                adminPanelBtn.style.display = 'inline-block';
            } else {
                adminPanelBtn.style.display = 'none';
            }
        }
    } else {
        // User is logged out
        showLoginBtn.style.display = 'inline-block';
        showRegisterBtn.style.display = 'inline-block';
        logoutBtn.style.display = 'none';
        adminPanelBtn.style.display = 'none';
        
        // Clear localStorage
        localStorage.removeItem('userRole');
        localStorage.removeItem('userTier');
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
