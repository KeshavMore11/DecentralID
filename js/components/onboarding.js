/**
 * Onboarding Component
 * 
 * Guides new users through creating their first DID.
 */
const onboardingComponent = {
    currentStep: 0,

    render() {
        return `
            <div class="onboarding-container">
                <div class="onboarding-card">
                    <div id="onboarding-content">
                        <!-- Content will be dynamically updated -->
                    </div>
                </div>
            </div>
        `;
    },

    init() {
        this.currentStep = 0;
        this.showStep(0);
    },

    showStep(step) {
        const content = document.getElementById('onboarding-content');
        if (!content) return;

        const steps = [
            this.welcomeStep(),
            this.createIdentityStep(),
            this.successStep()
        ];

        content.innerHTML = steps[step] || steps[0];
        this.currentStep = step;
    },

    welcomeStep() {
        return `
            <div class="onboarding-step">
                <div class="icon-large">🔐</div>
                <h1>Welcome to Your SSI Wallet</h1>
                <p class="subtitle">Take control of your digital identity</p>
                
                <div class="feature-list">
                    <div class="feature-item">
                        <span class="icon">🆔</span>
                        <div>
                            <h3>Decentralized Identity</h3>
                            <p>Create your own DID without relying on centralized authorities</p>
                        </div>
                    </div>
                    <div class="feature-item">
                        <span class="icon">🎓</span>
                        <div>
                            <h3>Academic Credentials</h3>
                            <p>Store and share your educational achievements securely</p>
                        </div>
                    </div>
                    <div class="feature-item">
                        <span class="icon">🛡️</span>
                        <div>
                            <h3>Self-Sovereign</h3>
                            <p>You own your data. Your keys, your control.</p>
                        </div>
                    </div>
                </div>

                <div class="button-group">
                    <button class="btn btn-secondary" onclick="navigateTo('role-select')">
                        Back
                    </button>
                    <button class="btn btn-primary btn-large" onclick="window.onboardingComponent.showStep(1)">
                        Get Started
                    </button>
                </div>
            </div>
        `;
    },

    createIdentityStep() {
        return `
            <div class="onboarding-step">
                <div class="icon-large">👤</div>
                <h1>Create Your Identity</h1>
                <p class="subtitle">Set up your digital wallet</p>

                <form id="create-identity-form" class="form-vertical">
                    <div class="form-group">
                        <label for="identity-alias">Identity Alias</label>
                        <input 
                            type="text" 
                            id="identity-alias" 
                            placeholder="e.g., My Academic Identity" 
                            required
                            autocomplete="off"
                        />
                        <small>A friendly name to identify this DID</small>
                    </div>

                    <div class="info-box">
                        <p><strong>What happens next:</strong></p>
                        <ul>
                            <li>A cryptographic key pair will be generated</li>
                            <li>Your DID will be derived from your public key</li>
                            <li>Keys are stored locally in your browser</li>
                        </ul>
                    </div>

                    <div class="button-group">
                        <button type="button" class="btn btn-secondary" onclick="window.onboardingComponent.showStep(0)">
                            Back
                        </button>
                        <button type="submit" class="btn btn-primary">
                            Create Identity
                        </button>
                    </div>
                </form>
            </div>
        `;
    },

    successStep() {
        const did = window.didManager.activeDID?.id || 'Unknown';
        return `
            <div class="onboarding-step">
                <div class="icon-large success">✓</div>
                <h1>Identity Created!</h1>
                <p class="subtitle">Your decentralized identity is ready to use</p>

                <div class="did-display">
                    <label>Your DID:</label>
                    <code class="did-code">${did}</code>
                    <button class="btn-icon" onclick="navigator.clipboard.writeText('${did}'); window.app.showSuccess('DID copied!')">
                        📋
                    </button>
                </div>

                <div class="info-box">
                     <p><strong>⚠️ Backup Required</strong></p>
                     <p>Since keys are stored only in this browser, please export a backup from the dashboard settings to prevent data loss.</p>
                </div>

                <button class="btn btn-primary btn-large" onclick="navigateTo('dashboard')">
                    Go to Dashboard
                </button>
            </div>
        `;
    },

    async handleCreateIdentity(event) {
        event.preventDefault();

        const alias = document.getElementById('identity-alias').value;

        try {
            window.app.showLoading();

            // Create DID (No PIN)
            await window.didManager.createDID(alias);

            window.app.hideLoading();
            window.app.showSuccess('Identity created successfully!');

            // Show success step
            onboardingComponent.showStep(2);

        } catch (error) {
            window.app.hideLoading();
            window.app.showError('Failed to create identity: ' + error.message);
        }
    }
};

// Event delegation for form submission
document.addEventListener('submit', (e) => {
    if (e.target.id === 'create-identity-form') {
        onboardingComponent.handleCreateIdentity(e);
    }
});

window.onboardingComponent = onboardingComponent;
