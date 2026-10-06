/**
 * API Configuration and Helper Functions
 * Centralized API calls for authentication
 */

// Detect environment and set appropriate API URL
const getApiBaseUrl = () => {
    // Check if running on GitHub Pages
    if (window.location.hostname === 'kash-gg.github.io') {
        // Production: Use deployed backend on Render
        // TODO: Replace this URL with your actual Render URL after deployment
        return 'https://project-ssi-backend.onrender.com/api';
    }
    // Local development
    return 'http://localhost:3000/api';
};

const API_BASE_URL = getApiBaseUrl();

const api = {
    /**
     * University Login
     */
    async universityLogin(email, password) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/university/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            // Store token in localStorage
            if (data.token) {
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userRole', 'university');
                localStorage.setItem('userData', JSON.stringify(data.user));
            }

            return data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Verifier Login
     */
    async verifierLogin(orgId, password) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/verifier/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ orgId, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            // Store token in localStorage
            if (data.token) {
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userRole', 'verifier');
                localStorage.setItem('userData', JSON.stringify(data.user));
            }

            return data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * University Registration
     */
    async universityRegister(email, password, universityName) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/university/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password, universityName })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Registration failed');
            }

            return data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Verifier Registration
     */
    async verifierRegister(orgId, password, organizationName) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/verifier/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ orgId, password, organizationName })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Registration failed');
            }

            return data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Get authentication token
     */
    getToken() {
        return localStorage.getItem('authToken');
    },

    /**
     * Get user data
     */
    getUserData() {
        const userData = localStorage.getItem('userData');
        return userData ? JSON.parse(userData) : null;
    },

    /**
     * Logout - clear stored authentication data
     */
    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userData');
    },

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.getToken();
    },

    /**
     * Make authenticated API call
     */
    async authenticatedRequest(url, options = {}) {
        const token = this.getToken();

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, {
            ...options,
            headers
        });

        if (response.status === 401 || response.status === 403) {
            // Token expired or invalid
            this.logout();
            throw new Error('Session expired. Please login again.');
        }

        return response;
    }
};

// Make api object available globally
window.api = api;
