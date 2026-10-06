/**
 * Role Selector Component
 * 
 * Entry point for the application, allowing users to select their role.
 */
window.roleSelectorComponent = {
    render() {
        return `
            <div class="role-selector fade-in-up">
                <div class="text-center mb-8">
                    <h1>What would you like to do?</h1>
                    <p class="subtitle">Select your role to continue</p>
                </div>

                <div class="role-cards">
                    <!-- University Role -->
                    <div class="role-card" onclick="navigateTo('uni-login')">
                        <div class="role-icon">🎓</div>
                        <h3>Issue Credentials</h3>
                        <p>Act as a university to issue academic credentials</p>
                    </div>

                    <!-- Student Role -->
                    <div class="role-card" onclick="window.roleSelectorComponent.handleStudentRoleClick()">
                        <div class="role-icon">👤</div>
                        <h3>My Credentials</h3>
                        <p>View and share your credentials selectively</p>
                    </div>

                    <!-- Verifier Role -->
                    <div class="role-card" onclick="navigateTo('verifier-login')">
                        <div class="role-icon">✔️</div>
                        <h3>Verify Credentials</h3>
                        <p>Check the validity of shared credentials</p>
                    </div>
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
                // Wallet exists, go directly to dashboard
                console.log('Existing wallet found, navigating to dashboard');
                navigateTo('dashboard');
            } else {
                // No wallet, show onboarding
                console.log('No wallet found, navigating to onboarding');
                navigateTo('onboarding');
            }
        } catch (error) {
            console.error('Error checking wallet:', error);
            // On error, default to onboarding
            navigateTo('onboarding');
        }
    }
};
