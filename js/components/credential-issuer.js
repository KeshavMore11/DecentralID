/**
 * Credential Issuer Component
 * 
 * Interface for universities to issue academic credentials.
 */
const credentialIssuerComponent = {
    courses: [],
    issuedCredentials: [],
    activeTab: 'issue', // 'issue' or 'history'

    render() {
        return `
            <div class="page-container">
                <header class="page-header">
                    <button class="btn-back" onclick="navigateTo('role-select')">← Back</button>
                    <h1>Issue Academic Credential</h1>
                </header>

                <div class="page-content">
                    
                    <!-- Tabs -->
                    <div class="verification-tabs">
                        <button class="tab-btn ${this.activeTab === 'issue' ? 'active' : ''}" 
                                onclick="credentialIssuerComponent.switchTab('issue')">
                            Issue New
                        </button>
                        <button class="tab-btn ${this.activeTab === 'history' ? 'active' : ''}" 
                                onclick="credentialIssuerComponent.switchTab('history')">
                            Issued History
                        </button>
                    </div>

                    <!-- Issue Tab -->
                    <div id="tab-issue" class="tab-content ${this.activeTab === 'issue' ? 'active' : ''}">
                        <div class="card">
                            <h2>University Portal</h2>
                            <p class="text-muted">Issue verifiable academic credentials to students</p>

                            <form id="issue-credential-form" class="form-vertical" onsubmit="event.preventDefault(); credentialIssuerComponent.handlePreview()">
                                <!-- Student Information -->
                                <div class="form-section">
                                    <h3>Student Information</h3>
                                    
                                    <div class="form-group">
                                        <label for="student-did">Student DID *</label>
                                        <input type="text" id="student-did" placeholder="did:key:..." required />
                                        <small>The decentralized identifier of the student</small>
                                    </div>

                                    <div class="form-group">
                                        <label for="student-name">Student Name *</label>
                                        <input type="text" id="student-name" placeholder="John Doe" required />
                                    </div>
                                </div>

                                <!-- Academic Information -->
                                <div class="form-section">
                                    <h3>Academic Information</h3>
                                    
                                    <div class="form-group">
                                        <label for="institution">Institution *</label>
                                        <input type="text" id="institution" placeholder="University Name" required />
                                    </div>

                                    <div class="form-group">
                                        <label for="degree">Degree Program *</label>
                                        <input type="text" id="degree" placeholder="Bachelor of Science in Computer Science" required />
                                    </div>
                                </div>

                                <!-- Courses -->
                                <div class="form-section">
                                    <div class="section-header">
                                        <h3>Courses</h3>
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
                                        Preview Credential
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <!-- History Tab -->
                    <div id="tab-history" class="tab-content ${this.activeTab === 'history' ? 'active' : ''}">
                        <div class="card">
                            <div class="section-header">
                                <h2>Issued Credentials</h2>
                                <button onclick="credentialIssuerComponent.loadHistory()" class="btn btn-small btn-secondary">Refresh</button>
                            </div>
                            
                            ${this.issuedCredentials.length > 0 ? `
                                <div class="table-responsive">
                                    <table class="table">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Student</th>
                                                <th>Degree</th>
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
                                <div class="empty-state">
                                    <div class="icon-large">📜</div>
                                    <p>No credentials issued yet</p>
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
                        <h2>Credential Preview</h2>
                        <button class="btn-close" onclick="credentialIssuerComponent.closePreview()">&times;</button>
                    </div>
                    <div class="modal-body" id="preview-content">
                        <!-- Content injected dynamically -->
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-secondary" onclick="credentialIssuerComponent.closePreview()">Edit</button>
                        <button class="btn btn-primary" onclick="credentialIssuerComponent.submitIssuance()">Sign & Issue</button>
                    </div>
                </div>
            </div>
        `;
    },

    async init() {
        this.courses = [];
        // Don't change activeTab here - keep it as is if user was on history tab
        // this.activeTab = 'issue';

        // Add one course by default
        this.addCourse();

        // Load history data
        await this.loadHistory();

        // If we're on history tab, force a re-render to show fresh data
        if (this.activeTab === 'history') {
            this.switchTab('history');
        }
    },

    switchTab(tab) {
        this.activeTab = tab;
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = this.render();
            // We need to restore courses if switching back to 'issue'
            if (tab === 'issue') {
                this.renderCourses();
            }
        }
    },

    addCourse() {
        const courseId = Date.now();
        this.courses.push({ id: courseId });
        this.renderCourses();
    },

    removeCourse(courseId) {
        this.courses = this.courses.filter(c => c.id !== courseId);
        this.renderCourses();
    },

    renderCourses() {
        const container = document.getElementById('courses-container');
        if (!container) return;

        container.innerHTML = this.courses.map(course => `
            <div class="course-item" id="course-${course.id}">
                <div class="course-fields">
                    <div class="form-group">
                        <label>Course Name *</label>
                        <input type="text" class="course-name" value="${course.courseName || ''}" onchange="credentialIssuerComponent.updateCourse(${course.id}, 'courseName', this.value)" placeholder="e.g., Blockchain Technology" required />
                    </div>
                    <div class="form-group">
                        <label>Grade *</label>
                        <select class="course-grade" onchange="credentialIssuerComponent.updateCourse(${course.id}, 'grade', this.value)" required>
                            <option value="">Select</option>
                            ${['O', 'A+', 'A', 'B+', 'B', 'C', 'P', 'F'].map(g => `<option value="${g}" ${course.grade === g ? 'selected' : ''}>${g}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Credits *</label>
                        <input type="number" class="course-credits" value="${course.credits || ''}" onchange="credentialIssuerComponent.updateCourse(${course.id}, 'credits', this.value)" placeholder="3" min="1" max="6" step="0.5" required />
                    </div>
                    <div class="form-group">
                        <label>Year *</label>
                        <input type="number" class="course-year" value="${course.year || ''}" onchange="credentialIssuerComponent.updateCourse(${course.id}, 'year', this.value)" placeholder="2024" min="2020" max="2030" required />
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
        // In a real app, we would query by issuer. 
        // Here we just filter all credentials where issuer == my current active DID
        const activeDID = window.didManager.activeDID?.id;
        if (!activeDID) return;

        const allCreds = await window.storageManager.getAll('credentials');
        if (allCreds) {
            this.issuedCredentials = allCreds.filter(c => c.issuer === activeDID);
        } else {
            this.issuedCredentials = [];
        }

        // If we are currently on history tab, update the UI
        if (this.activeTab === 'history') {
            const tbody = document.getElementById('history-table-body');
            if (tbody) {
                // Check if we still have credentials to show the table or empty state
                if (this.issuedCredentials.length > 0) {
                    tbody.innerHTML = this.renderHistoryRows();
                } else {
                    // Need to switch to show empty state
                    this.switchTab('history');
                }
            }
        }
    },

    renderHistoryRows() {
        return this.issuedCredentials.map(cred => `
            <tr>
                <td>${new Date(cred.issuanceDate).toLocaleDateString()}</td>
                <td>${cred.credentialSubject.name}</td>
                <td>${cred.credentialSubject.degree}</td>
                <td><span class="badge badge-success">Issued</span></td>
                <td>
                    <button class="btn btn-small btn-icon-danger" 
                            onclick="if(confirm('Are you sure you want to delete this credential? This will remove it from both your history and the student\\'s wallet.')) { credentialIssuerComponent.deleteCredential('${cred.id}'); }"
                            title="Delete credential">
                        🗑️
                    </button>
                </td>
            </tr>
        `).join('');
    },

    handlePreview() {
        // Collect Data
        const studentDID = document.getElementById('student-did').value;
        const studentName = document.getElementById('student-name').value;
        const institution = document.getElementById('institution').value;
        const degree = document.getElementById('degree').value;

        // Validate
        if (!studentDID || !studentName || !institution || !degree) {
            window.app.showError('Please fill in all required fields');
            return;
        }

        const validCourses = this.courses.filter(c => c.courseName && c.grade && c.credits && c.year);
        if (validCourses.length === 0) {
            window.app.showError('Please add at least one complete course');
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

        content.innerHTML = `
            <div class="credential-card" style="cursor: default; transform: none;">
                <div class="credential-header">
                    <h3>${institution}</h3>
                    <span class="badge badge-info">PREVIEW</span>
                </div>
                <div class="credential-detail-section">
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>Student Name</label>
                            <p>${studentName}</p>
                        </div>
                        <div class="detail-item">
                            <label>Degree</label>
                            <p>${degree}</p>
                        </div>
                        <div class="detail-item">
                            <label>Calculated GPA</label>
                            <p><strong>${this.pendingIssuanceData.gpa} / 10</strong></p>
                        </div>
                        <div class="detail-item">
                            <label>Student DID</label>
                            <p style="font-size: 0.8rem; word-break: break-all;">${studentDID}</p>
                        </div>
                    </div>
                </div>

                <div class="credential-detail-section">
                    <h3>Academic Record</h3>
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
                                    <td>${c.courseName}</td>
                                    <td>${c.grade}</td>
                                    <td>${c.credits}</td>
                                    <td>${c.year}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        modal.classList.remove('hidden');
    },

    closePreview() {
        document.getElementById('preview-modal').classList.add('hidden');
    },

    async submitIssuance() {
        try {
            this.closePreview();
            window.app.showLoading();

            // Issue credential
            const credential = await window.credentialManager.issueCredential(this.pendingIssuanceData);

            window.app.hideLoading();
            window.app.showSuccess('Credential issued successfully!');

            // Load history first, then switch tab to render with updated data
            await this.loadHistory();
            this.switchTab('history');

            // Clear pending data and form defaults
            this.pendingIssuanceData = null;
            this.courses = [];
            this.addCourse(); // Add back one default course

        } catch (error) {
            window.app.hideLoading();
            window.app.showError('Failed to issue credential: ' + error.message);
        }
    },

    async deleteCredential(id) {
        try {
            window.app.showLoading();

            // Delete the credential
            await window.credentialManager.deleteCredential(id);

            // Reload history to refresh the UI
            await this.loadHistory();

            window.app.hideLoading();
            window.app.showSuccess('Credential deleted successfully!');

            // Re-render the entire history tab to show empty state if needed
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
