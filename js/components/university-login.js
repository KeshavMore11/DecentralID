/**
 * University Login Component
 * 
 * Login screen for credential issuers (MIT-ADT University).
 */
window.universityLoginComponent = {
    render() {
        return `
            <div class="max-w-md mx-auto fade-in-up">
                <div class="mb-6">
                    <button onclick="navigateTo('role-select')" class="btn-back">
                        ← Back to Roles
                    </button>
                </div>

                <div class="card">
                    <div class="text-center mb-6">
                        <img src="assets/mit-adt-logo.png" alt="MIT Art, Design and Technology University" class="uni-login-logo" />
                        <h2>University Issuer Portal</h2>
                        <p class="subtitle" style="margin-bottom: 0;">Authorized Academic Credential Issuance</p>
                    </div>

                    <form id="uni-login-form" class="form-vertical" onsubmit="window.universityLoginComponent.handleLogin(event)">
                        <div class="form-group">
                            <label for="email">University Email</label>
                            <input type="email" id="email" value="admin@university.edu" placeholder="admin@university.edu" required>
                        </div>

                        <div class="form-group">
                            <label for="password">Password</label>
                            <input type="password" id="password" value="password" placeholder="••••••••" required>
                        </div>

                        <button type="submit" class="btn btn-primary btn-block mt-4">
                            Login into Issuer Portal
                        </button>
                    </form>
                    
                    <div class="mt-4 text-center">
                        <small class="text-muted">Demo Credentials: <code>admin@university.edu</code> / <code>password</code></small>
                    </div>
                </div>
            </div>
        `;
    },

    init() {
        console.log('University login initialized');
    },

    handleLogin(event) {
        event.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const submitButton = event.target.querySelector('button[type="submit"]');

        // Disable button and show loading state
        submitButton.disabled = true;
        submitButton.textContent = 'Authenticating...';

        // Use API for authentication
        window.api.universityLogin(email, password)
            .then(data => {
                window.app.showToast(data.message || 'Login successful', 'success');
                // Navigate to Issuer Dashboard
                setTimeout(() => {
                    navigateTo('issuer');
                }, 400);
            })
            .catch(error => {
                window.app.showToast(error.message || 'Login failed. Please try again.', 'error');
                // Re-enable button
                submitButton.disabled = false;
                submitButton.textContent = 'Login into Issuer Portal';
            });
    }
};
