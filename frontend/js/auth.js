// API Configuration
const API_URL = 'http://localhost:5009';

// Authentication State
let currentUser = null;
let authToken = localStorage.getItem('authToken');

// UI Elements
let authSection, mainSection, adminSection, loginForm, registerForm, usernameDisplay, adminUsernameDisplay, creditsDisplay;

// Initialize UI Elements
function initializeUIElements() {
    authSection = document.getElementById('auth-section');
    mainSection = document.getElementById('main-section');
    adminSection = document.getElementById('admin-section');
    loginForm = document.getElementById('login-form');
    registerForm = document.getElementById('register-form');
    usernameDisplay = document.getElementById('username-display');
    adminUsernameDisplay = document.getElementById('admin-username-display');
    creditsDisplay = document.getElementById('credits-display');

    if (!authSection || !mainSection || !adminSection || !loginForm || !registerForm) {
        console.error('Required DOM elements not found');
        return false;
    }
    return true;
}

// Check Authentication Status on Load
document.addEventListener('DOMContentLoaded', () => {
    if (initializeUIElements()) {
        checkAuthStatus();
    }
});

// Toggle between Login and Register forms
function toggleAuthForm() {
    loginForm.classList.toggle('hidden');
    registerForm.classList.toggle('hidden');
}

// Login Function
async function login() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        console.log('Login response:', data);

        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            updateUI();
            updateCreditsDisplay();
            
            // If user is admin, load admin dashboard data
            if (currentUser.is_admin) {
                loadCreditRequests();
                loadAnalytics();
            }
            
            showAlert('Login successful!', 'success');
        } else {
            showAlert(data.error || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showAlert('Login failed. Please try again.', 'error');
    }
}

// Register Function
async function register() {
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('Registration successful! Please login.', 'success');
            toggleAuthForm(); // Switch to login form
        } else {
            showAlert(data.error || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showAlert('Registration failed. Please try again.', 'error');
    }
}

// Logout Function
function logout() {
    localStorage.removeItem('authToken');
    authToken = null;
    currentUser = null;
    updateUI();
    showAlert('Logged out successfully', 'success');
}

// Check Authentication Status
async function checkAuthStatus() {
    if (!authToken) {
        updateUI();
        return;
    }

    try {
        const response = await fetch(`${API_URL}/user/profile`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const userData = await response.json();
            currentUser = userData;
            updateUI();
            updateCreditsDisplay();
        } else {
            logout(); // Token invalid or expired
        }
    } catch (error) {
        console.error('Auth check error:', error);
        logout();
    }
}

// Update UI based on authentication state
function updateUI() {
    if (!authSection || !mainSection || !adminSection) {
        console.error('Required DOM elements not found');
        return;
    }

    if (currentUser) {
        authSection.classList.add('hidden');
        
        if (currentUser.is_admin) {
            mainSection.classList.add('hidden');
            adminSection.classList.remove('hidden');
            if (adminUsernameDisplay) {
                adminUsernameDisplay.textContent = `Welcome, ${currentUser.username}!`;
            }
        } else {
            mainSection.classList.remove('hidden');
            adminSection.classList.add('hidden');
            if (usernameDisplay) {
                usernameDisplay.textContent = `Welcome, ${currentUser.username}!`;
            }
        }
    } else {
        authSection.classList.remove('hidden');
        mainSection.classList.add('hidden');
        adminSection.classList.add('hidden');
    }
}

// Update Credits Display
function updateCreditsDisplay() {
    if (currentUser) {
        creditsDisplay.textContent = `Credits: ${currentUser.credits}`;
    }
}

// Show Alert Message
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;

    // Remove any existing alerts
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());

    // Add new alert
    document.querySelector('#app').insertBefore(alertDiv, document.querySelector('.section'));

    // Remove alert after 3 seconds
    setTimeout(() => alertDiv.remove(), 3000);
}

// Export functions for use in other modules
window.login = login;
window.register = register;
window.logout = logout;
window.toggleAuthForm = toggleAuthForm; 