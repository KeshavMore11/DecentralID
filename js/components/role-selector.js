/**
 * Role Selector Component
 * 
 * Entry point for the DecentralID SSI Application.
 */
window.roleSelectorComponent = {
    render() {
        return `
            <div class="role-selector fade-in-up">
                <div class="text-center mb-8">
                    <div style="display: inline-flex; align-items: center; gap: 0.5rem; background: var(--primary-light); color: var(--primary); padding: 0.35rem 0.9rem; border-radius: 9999px; font-weight: 700; font-size: 0.8rem; text-transform: uppercase; margin-bottom: 1rem; border: 1px solid rgba(79, 70, 229, 0.2);">
                        ⚡ Self-Sovereign Identity (W3C DID & VC)
                    </div>
                    <h1>DecentralID Academic Portal</h1>
                    <p class="subtitle">Select your role to access decentralized identity services</p>
                </div>

                <div class="role-cards">
                    <!-- University Role -->
                    <div class="role-card" onclick="navigateTo('uni-login')">
                        <div class="role-icon" style="background: linear-gradient(135deg, rgba(79, 45, 127, 0.15) 0%, rgba(245, 158, 11, 0.15) 100%);">
                            🎓
                        </div>
                        <span class="badge badge-info" style="margin-bottom: 0.75rem;">MIT-ADT Portal</span>
                        <h3>University (Issuer)</h3>
                        <p>Issue cryptographically signed 10-point GPA academic credentials and degrees to students.</p>
                    </div>

                    <!-- Student Role -->
                    <div class="role-card" onclick="window.roleSelectorComponent.handleStudentRoleClick()">
                        <div class="role-icon" style="background: var(--primary-light);">
                            👤
                        </div>
                        <span class="badge badge-success" style="margin-bottom: 0.75rem;">Self-Sovereign</span>
                        <h3>Student (Holder)</h3>
                        <p>Manage your decentralized identity, view verifiable credentials, and share presentations selectively.</p>
                    </div>

                    <!-- Verifier Role -->
                    <div class="role-card" onclick="navigateTo('verifier-login')">
                        <div class="role-icon" style="background: rgba(14, 165, 233, 0.15);">
                            ✔️
                        </div>
                        <span class="badge badge-warning" style="margin-bottom: 0.75rem;">Instant Verification</span>
                        <h3>Verifier Portal</h3>
                        <p>Verify the cryptographic authenticity of academic credentials and selective disclosures in real time.</p>
                    </div>
                </div>

                <div style="margin-top: 3rem; text-align: center; color: var(--text-tertiary); font-size: 0.85rem;">
                    🔒 Powered by P-256 ECDSA Cryptography & W3C Verifiable Credentials Data Model
                </div>
            </div>
        `;
    },

    init() {
        console.log('Role selector initialized');
    },

    /**
     * Handle student role click - check for existing wallet
     */
    async handleStudentRoleClick() {
        try {
            // Check if student DID exists in IndexedDB
            const dids = await window.storageManager.getAll('dids');
            const studentDID = dids ? dids.find(d => d.alias !== 'MIT-ADT Issuer') : null;

            if (studentDID) {
                window.didManager.activeDID = studentDID;
                console.log('Existing wallet found, navigating to dashboard');
                navigateTo('dashboard');
            } else {
                console.log('No wallet found, navigating to onboarding');
                navigateTo('onboarding');
            }
        } catch (error) {
            console.error('Error checking wallet:', error);
            navigateTo('onboarding');
        }
    }
};
