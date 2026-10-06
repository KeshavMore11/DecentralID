/**
 * Credential Verifier Component
 * 
 * Interface for verifying credentials and selective disclosure presentations.
 */
const credentialVerifierComponent = {
    verificationResult: null,

    render() {
        return `
            <div class="page-container">
                <header class="page-header">
                    <button class="btn-back" onclick="navigateTo('role-select')">← Back</button>
                    <h1>Verify Credentials</h1>
                </header>

                <div class="page-content">
                    <div class="card">
                        <h2>Credential Verification</h2>
                        <p class="text-muted">Verify the authenticity of shared credentials or selective presentations</p>

                        <div class="verification-tabs">
                            <button class="tab-btn active" onclick="credentialVerifierComponent.switchTab('credential')">
                                Full Credential
                            </button>
                            <button class="tab-btn" onclick="credentialVerifierComponent.switchTab('selective')">
                                Selective Presentation
                            </button>
                        </div>

                        <div id="verification-input-area">
                            <div id="credential-tab" class="tab-content active">
                                <form id="verify-credential-form" class="form-vertical">
                                    <div class="form-group">
                                        <label for="credential-data">Paste Credential JSON</label>
                                        <textarea 
                                            id="credential-data" 
                                            rows="10" 
                                            placeholder='{"@context": [...], "type": [...], ...}'
                                            required
                                        ></textarea>
                                    </div>

                                    <button type="submit" class="btn btn-primary btn-block">
                                        Verify Credential
                                    </button>
                                </form>
                            </div>

                            <div id="selective-tab" class="tab-content">
                                <form id="verify-presentation-form" class="form-vertical">
                                    <div class="form-group">
                                        <label for="presentation-data">Paste Selective Presentation JSON</label>
                                        <textarea 
                                            id="presentation-data" 
                                            rows="10" 
                                            placeholder='{"@context": [...], "type": "SelectiveDisclosurePresentation", ...}'
                                            required
                                        ></textarea>
                                    </div>

                                    <button type="submit" class="btn btn-primary btn-block">
                                        Verify Presentation
                                    </button>
                                </form>
                            </div>
                        </div>

                        <div id="verification-result" class="verification-result hidden">
                            <!-- Populated after verification -->
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    init() {
        this.verificationResult = null;
    },

    switchTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(`${tab}-tab`).classList.add('active');

        // Hide previous results
        const resultDiv = document.getElementById('verification-result');
        if (resultDiv) resultDiv.classList.add('hidden');
    },

    async handleVerifyCredential(event) {
        event.preventDefault();

        const dataTextarea = document.getElementById('credential-data');
        const data = dataTextarea.value.trim();

        if (!data) {
            window.app.showError('Please paste credential data');
            return;
        }

        try {
            window.app.showLoading();

            const parsedData = JSON.parse(data);

            // Check if this is a selective presentation
            if (parsedData.type && Array.isArray(parsedData.type) &&
                parsedData.type.includes('SelectiveDisclosurePresentation')) {

                // Check if all fields are revealed (no commitments or empty commitments)
                const hasHiddenFields = parsedData.commitments &&
                    Object.keys(parsedData.commitments).length > 0;

                if (hasHiddenFields) {
                    window.app.hideLoading();
                    window.app.showError('This is a selective presentation with hidden fields. Please use the "Selective Presentation" tab to verify it.');
                    return;
                }

                // All fields are revealed, verify as selective presentation
                const result = await window.selectiveDisclosure.verifySelectivePresentation(parsedData);
                window.app.hideLoading();
                this.showVerificationResult(result, 'presentation', parsedData);
                return;
            }

            // Regular credential verification
            const result = await window.credentialManager.verifyCredential(parsedData);

            window.app.hideLoading();
            this.showVerificationResult(result, 'credential');

        } catch (error) {
            window.app.hideLoading();
            window.app.showError('Verification failed: ' + error.message);
        }
    },

    async handleVerifyPresentation(event) {
        event.preventDefault();

        const dataTextarea = document.getElementById('presentation-data');
        const data = dataTextarea.value.trim();

        if (!data) {
            window.app.showError('Please paste presentation data');
            return;
        }

        try {
            window.app.showLoading();

            const presentation = JSON.parse(data);
            const result = await window.selectiveDisclosure.verifySelectivePresentation(presentation);

            window.app.hideLoading();
            this.showVerificationResult(result, 'presentation', presentation);

        } catch (error) {
            window.app.hideLoading();
            window.app.showError('Verification failed: ' + error.message);
        }
    },

    showVerificationResult(result, type, presentation = null) {
        const resultDiv = document.getElementById('verification-result');
        if (!resultDiv) return;

        const isVerified = result.verified;
        const statusIcon = isVerified ? '✓' : '✗';
        const statusClass = isVerified ? 'success' : 'error';
        const statusText = isVerified ? 'Verified' : 'Verification Failed';

        let detailsHTML = '';

        if (type === 'credential') {
            detailsHTML = `
                <div class="verification-checks">
                    <h3>Verification Checks</h3>
                    ${Object.entries(result.checks).map(([check, passed]) => `
                        <div class="check-item ${passed ? 'check-pass' : 'check-fail'}">
                            <span class="check-icon">${passed ? '✓' : '✗'}</span>
                            <span class="check-name">${this.formatCheckName(check)}</span>
                        </div>
                    `).join('')}
                </div>
                
                ${result.issuer ? `
                    <div class="issuer-info">
                        <h3>Issuer</h3>
                        <code class="did-code-small">${result.issuer}</code>
                    </div>
                ` : ''}
            `;
        } else if (type === 'presentation') {
            const disclosed = Object.keys(result.disclosedAttributes || {});
            detailsHTML = `
                <div class="verification-checks">
                    <h3>Verification Checks</h3>
                    ${Object.entries(result.checks).map(([check, passed]) => `
                        <div class="check-item ${passed ? 'check-pass' : 'check-fail'}">
                            <span class="check-icon">${passed ? '✓' : '✗'}</span>
                            <span class="check-name">${this.formatCheckName(check)}</span>
                        </div>
                    `).join('')}
                </div>

                <div class="disclosure-summary">
                    <h3>Disclosure Summary</h3>
                    <div class="summary-grid">
                        <div class="summary-item">
                            <span class="summary-label">Revealed Attributes</span>
                            <span class="summary-value">${disclosed.length}</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Hidden Attributes</span>
                            <span class="summary-value">${result.hiddenCount || 0}</span>
                        </div>
                    </div>
                </div>

                ${disclosed.length > 0 ? `
                    <div class="disclosed-attributes">
                        <h3>Disclosed Information</h3>
                        <div class="attribute-list">
                            ${disclosed.map(key => {
                const value = result.disclosedAttributes[key];
                const displayValue = typeof value === 'object'
                    ? JSON.stringify(value, null, 2)
                    : value;
                return `
                                    <div class="attribute-item">
                                        <span class="attribute-key">${key}:</span>
                                        <span class="attribute-value">${displayValue}</span>
                                    </div>
                                `;
            }).join('')}
                        </div>
                    </div>
                ` : ''}
            `;
        }

        const errorsHTML = result.errors && result.errors.length > 0 ? `
            <div class="verification-errors">
                <h3>Errors</h3>
                <ul>
                    ${result.errors.map(err => `<li>${err}</li>`).join('')}
                </ul>
            </div>
        ` : '';

        resultDiv.innerHTML = `
            <div class="verification-header ${statusClass}">
                <div class="status-icon-large">${statusIcon}</div>
                <h2>${statusText}</h2>
            </div>

            ${detailsHTML}
            ${errorsHTML}

            <div class="result-actions">
                <button class="btn btn-secondary" onclick="credentialVerifierComponent.reset()">
                    Verify Another
                </button>
            </div>
        `;

        resultDiv.classList.remove('hidden');

        if (isVerified) {
            window.app.showSuccess('Verification successful!');
        } else {
            window.app.showError('Verification failed');
        }
    },

    formatCheckName(check) {
        return check
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    },

    reset() {
        const resultDiv = document.getElementById('verification-result');
        if (resultDiv) resultDiv.classList.add('hidden');

        // Clear textareas
        const credentialData = document.getElementById('credential-data');
        const presentationData = document.getElementById('presentation-data');

        if (credentialData) credentialData.value = '';
        if (presentationData) presentationData.value = '';

        this.verificationResult = null;
    }
};

// Event delegation for form submissions
document.addEventListener('submit', (e) => {
    if (e.target.id === 'verify-credential-form') {
        credentialVerifierComponent.handleVerifyCredential(e);
    } else if (e.target.id === 'verify-presentation-form') {
        credentialVerifierComponent.handleVerifyPresentation(e);
    }
});

window.credentialVerifierComponent = credentialVerifierComponent;
