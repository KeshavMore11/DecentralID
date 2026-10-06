/**
 * Dashboard Component
 * 
 * Main dashboard showing user's identity and credentials.
 */
const dashboardComponent = {
    render() {
        return `
            <div class="dashboard-container">
                <header class="dashboard-header">
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <button class="btn-back" onclick="navigateTo('role-select')">← Back</button>
                        <h1>Student Wallet</h1>
                    </div>
                    <div class="header-actions" style="display: flex; gap: 10px;">
                        <button class="btn-icon" onclick="dashboardComponent.refresh()" title="Refresh">
                            🔄
                        </button>
                        <button class="btn-icon" onclick="dashboardComponent.toggleSettings()" title="Settings">
                            ⚙️
                        </button>
                    </div>
                </header>

                <div class="dashboard-content">
                    <!-- Identity Card -->
                    <div id="identity-card" class="card">
                        <!-- Populated by init() -->
                    </div>

                    <!-- Main Action -->
                    <div class="action-section mb-6">
                        <div class="role-card" onclick="navigateTo('holder')" style="width: 100%; max-width: 100%; flex-direction: row; justify-content: start; padding: 20px;">
                            <div class="role-icon" style="margin-bottom: 0; margin-right: 20px;">👤</div>
                            <div class="text-left">
                                <h3>My Credentials</h3>
                                <p style="margin: 0;">View and manage your verified credentials</p>
                            </div>
                            <div style="margin-left: auto;">→</div>
                        </div>
                    </div>

                    <!-- Recent Activity -->
                    <div id="recent-activity" class="card">
                        <h2>Recent Activity</h2>
                        <div id="activity-list">
                            <!-- Populated by init() -->
                        </div>
                    </div>
                </div>

                <!-- Settings Modal -->
                <div id="settings-modal" class="modal hidden">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h2>Wallet Settings</h2>
                            <button class="btn-close" onclick="dashboardComponent.toggleSettings()">&times;</button>
                        </div>
                        <div class="modal-body">
                             <div class="credential-detail-section">
                                <h3>Backup & Restore</h3>
                                <p class="text-muted mb-4">Export your wallet to safe keep your identity. Import to restore on another device.</p>
                                
                                <button class="btn btn-secondary btn-block mb-4" onclick="dashboardComponent.exportWallet()">
                                    📤 Export Wallet
                                </button>
                                
                                <div class="form-group">
                                    <label>Import Wallet</label>
                                    <input type="file" id="import-file" accept=".json" onchange="dashboardComponent.importWallet(this)" />
                                </div>
                             </div>

                             <hr style="margin: 20px 0; border: 1px solid var(--glass-border);" />

                             <div class="credential-detail-section">
                                <h3 style="color: var(--error-color);">⚠️ Danger Zone</h3>
                                <p class="text-muted mb-4">Permanently delete your identity and all associated credentials. This action cannot be undone.</p>
                                
                                <button class="btn btn-danger btn-block" onclick="dashboardComponent.deleteIdentity()">
                                    🗑️ Delete Identity
                                </button>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    async init() {
        await this.renderIdentityCard();
        await this.renderRecentActivity();
    },

    toggleSettings() {
        const modal = document.getElementById('settings-modal');
        if (modal) modal.classList.toggle('hidden');
    },

    async refresh() {
        // Re-initialize the dashboard to reload all data
        await this.renderIdentityCard();
        await this.renderRecentActivity();
        window.app.showSuccess('Dashboard refreshed');
    },

    async renderIdentityCard() {
        const card = document.getElementById('identity-card');
        if (!card) return;

        const did = window.didManager.activeDID;
        if (!did) {
            card.innerHTML = '<p>No active identity</p>';
            return;
        }

        const credentials = await window.credentialManager.getMyCredentials();

        card.innerHTML = `
            <div class="identity-header">
                <div class="avatar">👤</div>
                <div class="identity-info">
                    <h2>${did.alias || 'My Identity'}</h2>
                    <div class="did-display">
                        <code class="did-code-short">${this.shortenDID(did.id)}</code>
                        <button class="btn-icon-small" onclick="navigator.clipboard.writeText('${did.id}'); window.app.showSuccess('DID copied!')">
                            📋
                        </button>
                    </div>
                    <span class="badge badge-success">
                        Active
                    </span>
                </div>
            </div>
            <div class="identity-stats">
                <div class="stat">
                    <span class="stat-value">${credentials.length}</span>
                    <span class="stat-label">Credentials</span>
                </div>
                <div class="stat">
                    <span class="stat-value">${did.created ? new Date(did.created).toLocaleDateString() : 'N/A'}</span>
                    <span class="stat-label">Created</span>
                </div>
            </div>
        `;
    },

    async renderRecentActivity() {
        const activityList = document.getElementById('activity-list');
        if (!activityList) return;

        const credentials = await window.credentialManager.getMyCredentials();

        if (credentials.length === 0) {
            activityList.innerHTML = `
                <div class="empty-state">
                    <p>No activity yet</p>
                    <p class="text-muted">Issue or receive credentials to get started</p>
                </div>
            `;
            return;
        }

        // Sort by date desc
        const sorted = [...credentials].sort((a, b) => new Date(b.issuanceDate) - new Date(a.issuanceDate));

        const activities = sorted
            .slice(0, 5)
            .map(cred => {
                const isIssued = cred.issuer === window.didManager.activeDID?.id;
                return `
                    <div class="activity-item" style="display:flex; gap:10px; padding:10px; border-bottom:1px solid var(--glass-border);">
                        <span class="activity-icon" style="font-size:1.5em;">${isIssued ? '📤' : '📥'}</span>
                        <div class="activity-details">
                            <p class="activity-title" style="margin:0; font-weight:600;">${isIssued ? 'Issued' : 'Received'} credential</p>
                            <small class="text-muted">${cred.credentialSubject.degree || 'Credential'}</small>
                            <p class="activity-meta" style="margin:0; font-size:0.8em; color:var(--text-tertiary);">${new Date(cred.issuanceDate).toLocaleString()}</p>
                        </div>
                    </div>
                `;
            })
            .join('');

        activityList.innerHTML = activities;
    },

    shortenDID(did) {
        if (!did || did.length < 20) return did;
        return `${did.substring(0, 15)}...${did.substring(did.length - 10)}`;
    },

    async exportWallet() {
        try {
            const data = await window.didManager.exportWallet();
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ssi-wallet-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            window.app.showSuccess('Wallet backup downloaded');
        } catch (e) {
            window.app.showError('Export failed: ' + e.message);
        }
    },

    async deleteIdentity() {
        // Confirm with user
        const confirmed = confirm(
            '⚠️ WARNING: This will permanently delete your identity and all credentials.\n\n' +
            'This action cannot be undone!\n\n' +
            'Are you sure you want to continue?'
        );

        if (!confirmed) return;

        // Double confirmation
        const doubleConfirm = confirm(
            'This is your last chance!\n\n' +
            'Click OK to permanently delete your identity.'
        );

        if (!doubleConfirm) return;

        try {
            window.app.showLoading();

            // Delete DID and all credentials from IndexedDB
            await window.didManager.deleteDID();

            window.app.hideLoading();
            window.app.showSuccess('Identity deleted successfully');

            // Always redirect to role selector page after deletion
            setTimeout(() => {
                navigateTo('role-select');
            }, 1000);

        } catch (error) {
            window.app.hideLoading();
            window.app.showError('Failed to delete identity: ' + error.message);
        }
    },

    async importWallet(input) {
        const file = input.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const json = e.target.result;
                await window.didManager.importWallet(json);
                window.app.showSuccess('Wallet imported successfully!');
                setTimeout(() => window.location.reload(), 1000);
            } catch (err) {
                window.app.showError('Import failed: ' + err.message);
            }
        };
        reader.readAsText(file);
    }
};

window.dashboardComponent = dashboardComponent;
