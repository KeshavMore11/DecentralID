/**
 * Credential Issuer Component
 * 
 * Interface for MIT-ADT University to issue verifiable academic credentials
 * with DID ECDSA and Ethereum EIP-712 MetaMask signatures on Sepolia testnet.
 */
const credentialIssuerComponent = {
    courses: [],
    issuedCredentials: [],
    activeTab: 'issue', // 'issue' or 'history'
    currentMetaMaskStatus: null,

    render() {
        const issuerDID = window.didManager.activeDID?.id || 'MIT-ADT Issuer';

        return `
            <div class="page-container">
                <header class="page-header">
                    <button class="btn-back" onclick="navigateTo('role-select')">← Back to Roles</button>
                    <h1>University Issuance Portal</h1>
                </header>

                <div class="page-content">
                    
                    <!-- MIT-ADT University Branded Hero Header -->
                    <div class="uni-issuer-hero">
                        <div class="uni-issuer-brand">
                            <div class="uni-logo-box">
                                <img src="assets/mit-adt-logo.png" alt="MIT Art, Design and Technology University" class="uni-issuer-logo" />
                            </div>
                            <div class="uni-issuer-details">
                                <div class="uni-badge-row">
                                    <span class="badge badge-success"><span class="badge-dot"></span> Authorized Issuer</span>
                                    <span class="badge badge-info">UGC Recognized</span>
                                </div>
                                <h2>MIT Art, Design and Technology University</h2>
                                <p class="uni-tagline">Pune, India • A Leap Towards World Class Education</p>
                            </div>
                        </div>
                        <div class="uni-issuer-meta">
                            <div class="issuer-did-chip">
                                <span class="chip-label">Active Issuer Identity</span>
                                <code class="did-code-small">${issuerDID}</code>
                            </div>
                        </div>
                    </div>

                    <!-- Navigation Tabs -->
                    <div class="verification-tabs">
                        <button class="tab-btn ${this.activeTab === 'issue' ? 'active' : ''}" 
                                onclick="credentialIssuerComponent.switchTab('issue')">
                            ✍️ Issue New Credential
                        </button>
                        <button class="tab-btn ${this.activeTab === 'history' ? 'active' : ''}" 
                                onclick="credentialIssuerComponent.switchTab('history')">
                            📜 Issued History (${this.issuedCredentials.length})
                        </button>
                    </div>

                    <!-- Issue Tab -->
                    <div id="tab-issue" class="tab-content ${this.activeTab === 'issue' ? 'active' : ''}">
                        <div class="card">
                            <div class="section-header">
                                <div>
                                    <h2>Issue Verifiable Academic Credential</h2>
                                    <p class="text-muted">Dual Cryptographic Signing: W3C DID ECDSA Key + Ethereum EIP-712 MetaMask (Sepolia)</p>
                                </div>
                            </div>

                            <!-- MetaMask Web3 Status Line -->
                            <div id="issuer-metamask-status">
                                ${this.renderMetaMaskStatusHTML(this.currentMetaMaskStatus)}
                            </div>

                            <form id="issue-credential-form" class="form-vertical" onsubmit="event.preventDefault(); credentialIssuerComponent.handlePreview()">
                                <!-- Student Information -->
                                <div class="form-section">
                                    <h3>Student Recipient Information</h3>
                                    
                                    <div class="form-group">
                                        <label for="student-did">Student DID *</label>
                                        <input type="text" id="student-did" placeholder="did:key:..." required />
                                        <small>The recipient student's decentralized identifier (obtained from their wallet)</small>
                                    </div>

                                    <div class="form-group">
                                        <label for="student-name">Student Full Name *</label>
                                        <input type="text" id="student-name" placeholder="e.g., Keshav More" required />
                                    </div>
                                </div>

                                <!-- Academic Information -->
                                <div class="form-section">
                                    <h3>Academic Degree & Program</h3>
                                    
                                    <div class="form-group">
                                        <label for="institution">Awarding Institution *</label>
                                        <input type="text" id="institution" value="MIT Art, Design and Technology University, Pune" placeholder="MIT Art, Design and Technology University, Pune" required />
                                    </div>

                                    <div class="form-group">
                                        <label for="degree">Degree Program *</label>
                                        <input type="text" id="degree" placeholder="Bachelor of Technology in Computer Science & Engineering" value="B.Tech Computer Science & Engineering" required />
                                    </div>
                                </div>

                                <!-- Courses -->
                                <div class="form-section">
                                    <div class="section-header">
                                        <div>
                                            <h3>Courses & Grading (10-Point Scale)</h3>
                                            <p class="text-muted" style="font-size: 0.85rem; margin-bottom: 0;">Grades: O (10), A+ (9), A (8), B+ (7), B (6), C (5), P (4), F (0)</p>
                                        </div>
                                        <button type="button" class="btn btn-secondary btn-small" onclick="credentialIssuerComponent.addCourse()">
                                            + Add Course
                                        </button>
                                    </div>

                                    <div id="courses-container">
                                        <!-- Courses added dynamically -->
                                    </div>
                                </div>

                                <div class="button-group">
                                    <button type="button" class="btn btn-secondary" onclick="navigateTo('role-select')">
                                        Cancel
                                    </button>
                                    <button type="submit" class="btn btn-primary">
                                        Preview Credential Specimen →
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <!-- History Tab -->
                    <div id="tab-history" class="tab-content ${this.activeTab === 'history' ? 'active' : ''}">
                        <div class="card">
                            <div class="section-header">
                                <div>
                                    <h2>Issued Credentials Registry</h2>
                                    <p class="text-muted">History of verifiable credentials issued by MIT-ADT University</p>
                                </div>
                                <button onclick="credentialIssuerComponent.loadHistory()" class="btn btn-small btn-secondary">🔄 Refresh</button>
                            </div>
                            
                            ${this.issuedCredentials.length > 0 ? `
                                <div class="table-responsive">
                                    <table class="table">
                                        <thead>
                                            <tr>
                                                <th>Issuance Date</th>
                                                <th>Student Name</th>
                                                <th>Degree Program</th>
                                                <th>CGPA</th>
                                                <th>Ethereum Signer</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody id="history-table-body">
                                            ${this.renderHistoryRows()}
                                        </tbody>
                                    </table>
                                </div>
                            ` : `
                                <div class="empty-state text-center" style="padding: 3rem 1rem;">
                                    <div style="font-size: 3rem; margin-bottom: 1rem;">📜</div>
                                    <h3>No Credentials Issued Yet</h3>
                                    <p class="text-muted">Use the "Issue New Credential" tab to issue academic records to students.</p>
                                </div>
                            `}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Preview Modal -->
            <div id="preview-modal" class="modal hidden">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Verifiable Credential Specimen</h2>
                        <button class="btn-close" onclick="credentialIssuerComponent.closePreview()">&times;</button>
                    </div>
                    <div class="modal-body" id="preview-content">
                        <!-- Content injected dynamically -->
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-secondary" onclick="credentialIssuerComponent.closePreview()">← Edit Details</button>
                        <button class="btn btn-primary" id="btn-sign-issue" onclick="credentialIssuerComponent.submitIssuance()">
                            🦊 Sign with MetaMask & Issue
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    async init() {
        this.courses = [];
        this.addCourse();
        await this.loadHistory();
        await this.initMetaMask();

        if (this.activeTab === 'history') {
            this.switchTab('history');
        }
    },

    async initMetaMask() {
        if (window.web3Signer) {
            this.currentMetaMaskStatus = await window.web3Signer.getStatus();
            this.updateStatusUI(this.currentMetaMaskStatus);

            window.web3Signer.onStateChange(status => {
                this.currentMetaMaskStatus = status;
                this.updateStatusUI(status);
            });
        }
    },

    renderMetaMaskStatusHTML(status) {
        if (!status) {
            return `
                <div class="metamask-status-bar">
                    <div class="metamask-status-info">
                        <span class="metamask-icon">🦊</span>
                        <span class="metamask-label">MetaMask:</span>
                        <span class="metamask-state">Checking wallet...</span>
                    </div>
                </div>
            `;
        }

        if (!status.available) {
            return `
                <div class="metamask-status-bar" style="border-left: 4px solid var(--accent-amber);">
                    <div class="metamask-status-info">
                        <span class="metamask-icon">🦊</span>
                        <span class="metamask-label">MetaMask:</span>
                        <span class="metamask-state" style="color: var(--accent-amber);">Not detected</span>
                    </div>
                    <a href="https://metamask.io/download/" target="_blank" class="btn btn-small btn-secondary">
                        Install MetaMask ↗
                    </a>
                </div>
            `;
        }

        if (!status.connected) {
            return `
                <div class="metamask-status-bar">
                    <div class="metamask-status-info">
                        <span class="metamask-icon">🦊</span>
                        <span class="metamask-label">MetaMask:</span>
                        <span class="metamask-state" style="color: var(--text-tertiary);">Not connected</span>
                    </div>
                    <button type="button" class="btn btn-small btn-primary" onclick="credentialIssuerComponent.connectMetaMask()">
                        Connect MetaMask
                    </button>
                </div>
            `;
        }

        if (!status.isSepolia) {
            return `
                <div class="metamask-status-bar" style="border-left: 4px solid var(--accent-amber);">
                    <div class="metamask-status-info">
                        <span class="metamask-icon">🦊</span>
                        <span class="metamask-label">MetaMask:</span>
                        <span class="metamask-state">Connected <code>${status.formattedAddress}</code></span>
                        <span class="badge badge-warning">Wrong Network (${status.chainId || 'Unknown'})</span>
                    </div>
                    <button type="button" class="btn btn-small btn-secondary" onclick="credentialIssuerComponent.switchNetwork()">
                        Switch to Sepolia
                    </button>
                </div>
            `;
        }

        return `
            <div class="metamask-status-bar" style="border-left: 4px solid var(--accent-green);">
                <div class="metamask-status-info">
                    <span class="metamask-icon">🦊</span>
                    <span class="metamask-label">MetaMask:</span>
                    <span class="metamask-state">Connected <code class="did-code-small">${status.formattedAddress}</code> · Sepolia</span>
                    <span class="badge badge-success"><span class="badge-dot"></span> Ready to Sign</span>
                </div>
            </div>
        `;
    },

    updateStatusUI(status) {
        const container = document.getElementById('issuer-metamask-status');
        if (container) {
            container.innerHTML = this.renderMetaMaskStatusHTML(status);
        }

        // Also update modal status element if preview modal is currently open
        const modalStatus = document.getElementById('modal-metamask-status');
        if (modalStatus) {
            modalStatus.innerHTML = this.renderMetaMaskStatusHTML(status);
        }
    },

    async connectMetaMask() {
        try {
            if (!window.web3Signer) {
                throw new Error("Web3 signer module is not loaded.");
            }
            await window.web3Signer.connect();
            await window.web3Signer.ensureSepolia();
            this.currentMetaMaskStatus = await window.web3Signer.getStatus();
            this.updateStatusUI(this.currentMetaMaskStatus);
            window.app.showSuccess("Connected to MetaMask on Sepolia testnet");
        } catch (error) {
            window.app.showError(error.message);
        }
    },

    async switchNetwork() {
        try {
            if (!window.web3Signer) return;
            await window.web3Signer.ensureSepolia();
            this.currentMetaMaskStatus = await window.web3Signer.getStatus();
            this.updateStatusUI(this.currentMetaMaskStatus);
            window.app.showSuccess("Switched to Sepolia testnet");
        } catch (error) {
            window.app.showError(error.message);
        }
    },

    switchTab(tab) {
        this.activeTab = tab;
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = this.render();
            if (tab === 'issue') {
                this.renderCourses();
                this.updateStatusUI(this.currentMetaMaskStatus);
            }
        }
    },

    addCourse() {
        const courseId = Date.now();
        this.courses.push({ id: courseId, courseName: '', grade: 'A', credits: 4, year: 2024 });
        this.renderCourses();
    },

    removeCourse(courseId) {
        this.courses = this.courses.filter(c => c.id !== courseId);
        if (this.courses.length === 0) {
            this.addCourse();
        } else {
            this.renderCourses();
        }
    },

    renderCourses() {
        const container = document.getElementById('courses-container');
        if (!container) return;

        container.innerHTML = this.courses.map(course => `
            <div class="course-item" id="course-${course.id}">
                <div class="course-fields">
                    <div class="form-group">
                        <label>Course Name *</label>
                        <input type="text" class="course-name" value="${course.courseName || ''}" oninput="credentialIssuerComponent.updateCourse(${course.id}, 'courseName', this.value)" placeholder="e.g., Mathematics-I" required />
                    </div>
                    <div class="form-group">
                        <label>Grade (10-Pt Scale) *</label>
                        <select class="course-grade" onchange="credentialIssuerComponent.updateCourse(${course.id}, 'grade', this.value)" required>
                            <option value="">Select</option>
                            ${['O', 'A+', 'A', 'B+', 'B', 'C', 'P', 'F'].map(g => `<option value="${g}" ${course.grade === g ? 'selected' : ''}>${g}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Credits *</label>
                        <input type="number" class="course-credits" value="${course.credits || ''}" oninput="credentialIssuerComponent.updateCourse(${course.id}, 'credits', this.value)" placeholder="4" min="1" max="10" step="0.5" required />
                    </div>
                    <div class="form-group">
                        <label>Year *</label>
                        <input type="number" class="course-year" value="${course.year || '2024'}" oninput="credentialIssuerComponent.updateCourse(${course.id}, 'year', this.value)" placeholder="2024" min="2020" max="2030" required />
                    </div>
                </div>
                <button type="button" class="btn-icon-danger" onclick="credentialIssuerComponent.removeCourse(${course.id})" title="Remove course">
                    🗑️
                </button>
            </div>
        `).join('');
    },

    updateCourse(id, field, value) {
        const course = this.courses.find(c => c.id === id);
        if (course) {
            course[field] = value;
        }
    },

    async loadHistory() {
        const activeDID = window.didManager.activeDID?.id;
        if (!activeDID) return;

        const allCreds = await window.storageManager.getAll('credentials');
        if (allCreds) {
            this.issuedCredentials = allCreds.filter(c => c.issuer === activeDID);
        } else {
            this.issuedCredentials = [];
        }

        if (this.activeTab === 'history') {
            const tbody = document.getElementById('history-table-body');
            if (tbody) {
                if (this.issuedCredentials.length > 0) {
                    tbody.innerHTML = this.renderHistoryRows();
                } else {
                    this.switchTab('history');
                }
            }
        }
    },

    renderHistoryRows() {
        return this.issuedCredentials.map(cred => {
            const gpa = cred.credentialSubject.gpa || 'N/A';
            const scale = cred.credentialSubject.gpaScale || 10;
            const ethSigner = cred.ethereumProof?.signerAddress;
            const shortEthSigner = ethSigner ? (window.web3Signer?.formatAddress(ethSigner) || ethSigner) : 'None';

            return `
                <tr>
                    <td>${new Date(cred.issuanceDate).toLocaleDateString()}</td>
                    <td><strong>${cred.credentialSubject.name}</strong></td>
                    <td>${cred.credentialSubject.degree}</td>
                    <td><span class="badge badge-info">${gpa}/${scale}</span></td>
                    <td>${ethSigner ? `<code class="did-code-small" title="${ethSigner}">${shortEthSigner}</code>` : '<span class="text-muted">Legacy</span>'}</td>
                    <td><span class="badge badge-success"><span class="badge-dot"></span> Signed & Issued</span></td>
                    <td>
                        <button class="btn btn-small btn-icon-danger" 
                                onclick="if(confirm('Are you sure you want to delete this credential? This will remove it from history and the student\\'s wallet.')) { credentialIssuerComponent.deleteCredential('${cred.id}'); }"
                                title="Delete credential">
                            🗑️
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    handlePreview() {
        const studentDID = document.getElementById('student-did').value.trim();
        const studentName = document.getElementById('student-name').value.trim();
        const institution = document.getElementById('institution').value.trim();
        const degree = document.getElementById('degree').value.trim();

        if (!studentDID || !studentName || !institution || !degree) {
            window.app.showError('Please fill in all required fields');
            return;
        }

        const validCourses = this.courses.filter(c => c.courseName && c.grade && c.credits && c.year);
        if (validCourses.length === 0) {
            window.app.showError('Please add at least one complete course with name, grade, and credits');
            return;
        }

        let coursesData = [];
        try {
            coursesData = validCourses.map(c => ({
                courseName: c.courseName,
                grade: c.grade,
                credits: parseFloat(c.credits),
                year: parseInt(c.year)
            }));
            const gpa = window.credentialManager.calculateGPA(coursesData);
            this.pendingIssuanceData = {
                studentDID,
                studentName,
                institution,
                degree,
                courses: coursesData,
                gpa
            };
        } catch (error) {
            window.app.showError('Invalid course data: ' + error.message);
            return;
        }

        // Show Modal
        const modal = document.getElementById('preview-modal');
        const content = document.getElementById('preview-content');

        const ethStatus = this.currentMetaMaskStatus;
        const signerText = ethStatus?.connected && ethStatus?.isSepolia
            ? `Connected: ${ethStatus.account} (Sepolia)`
            : 'MetaMask will prompt to connect & sign on Sepolia';

        content.innerHTML = `
            <div id="modal-metamask-status" style="margin-bottom: 1.25rem;">
                ${this.renderMetaMaskStatusHTML(ethStatus)}
            </div>

            <div class="credential-card credential-preview-certificate" style="cursor: default; transform: none;">
                <div class="cert-header">
                    <img src="assets/mit-adt-logo.png" alt="MIT-ADT University" class="cert-logo" />
                    <div class="cert-title-block">
                        <h3>${institution}</h3>
                        <p class="cert-subtitle">Official Verifiable Academic Credential</p>
                    </div>
                    <span class="badge badge-info cert-badge">SPECIMEN</span>
                </div>

                <div class="credential-detail-section">
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>Student Name</label>
                            <p style="font-size: 1.1rem; color: var(--primary);">${studentName}</p>
                        </div>
                        <div class="detail-item">
                            <label>Degree Program</label>
                            <p>${degree}</p>
                        </div>
                        <div class="detail-item">
                            <label>Calculated CGPA</label>
                            <p style="font-size: 1.2rem; color: var(--brand-gold);"><strong>${this.pendingIssuanceData.gpa} / 10</strong></p>
                        </div>
                        <div class="detail-item">
                            <label>Student Recipient DID</label>
                            <code class="did-code-small">${studentDID}</code>
                        </div>
                        <div class="detail-item" style="grid-column: 1 / -1;">
                            <label>Ethereum Issuer Signer (Sepolia Testnet)</label>
                            <p style="font-size: 0.9rem; font-weight: 500; color: var(--text-secondary);">${signerText}</p>
                        </div>
                    </div>
                </div>

                <div class="credential-detail-section">
                    <h3>Course Breakdown & Grade Points</h3>
                    <div class="table-responsive">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Course</th>
                                    <th>Grade</th>
                                    <th>Credits</th>
                                    <th>Year</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.pendingIssuanceData.courses.map(c => `
                                    <tr>
                                        <td><strong>${c.courseName}</strong></td>
                                        <td><span class="badge badge-info">${c.grade}</span></td>
                                        <td>${c.credits}</td>
                                        <td>${c.year}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        modal.classList.remove('hidden');
    },

    closePreview() {
        document.getElementById('preview-modal').classList.add('hidden');
    },

    async submitIssuance() {
        const signButton = document.getElementById('btn-sign-issue');
        const originalButtonHTML = signButton ? signButton.innerHTML : '🦊 Sign with MetaMask & Issue';

        try {
            if (signButton) {
                signButton.disabled = true;
                signButton.innerHTML = '⏳ Waiting for MetaMask signature...';
            }

            window.app.showToast('Please confirm the EIP-712 credential signature in your MetaMask popup...', 'info');

            // Issue credential with DID ECDSA and Ethereum EIP-712 proofs
            const credential = await window.credentialManager.issueCredential(this.pendingIssuanceData);

            this.closePreview();
            window.app.showSuccess('✓ Verifiable Credential signed with MetaMask & issued successfully!');

            await this.loadHistory();
            this.switchTab('history');

            this.pendingIssuanceData = null;
            this.courses = [];
            this.addCourse();

        } catch (error) {
            console.error('Issuance error:', error);
            window.app.showError('Issuance failed: ' + (error.message || error));
        } finally {
            if (signButton) {
                signButton.disabled = false;
                signButton.innerHTML = originalButtonHTML;
            }
        }
    },

    async deleteCredential(id) {
        try {
            window.app.showLoading();
            await window.credentialManager.deleteCredential(id);
            await this.loadHistory();
            window.app.hideLoading();
            window.app.showSuccess('Credential deleted successfully');

            if (this.activeTab === 'history') {
                this.switchTab('history');
            }
        } catch (error) {
            window.app.hideLoading();
            window.app.showError('Failed to delete credential: ' + error.message);
        }
    }
};

window.credentialIssuerComponent = credentialIssuerComponent;
