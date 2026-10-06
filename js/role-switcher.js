/**
 * Role Switcher
 * Keeps the right DID active for the selected role (Issuer / Student),
 * even after page reloads or navigation.
 */
(function () {
    const ISSUER_ALIAS = 'MIT-ADT Issuer';
    const KEY = 'ssi_role';
    const getRole = () => localStorage.getItem(KEY) || 'student';

    async function applyRole() {
        const role = getRole();
        const dids = await window.storageManager.getAll('dids');

        if (role === 'issuer') {
            let issuer = dids.find(d => d.alias === ISSUER_ALIAS);
            if (!issuer) issuer = await window.didManager.createDID(ISSUER_ALIAS);
            window.didManager.activeDID = issuer;
        } else {
            const student = dids.find(d => d.alias !== ISSUER_ALIAS);
            window.didManager.activeDID = student || null;
        }
    }

    // Run after the original init so our role always wins
    const originalInit = window.didManager.init.bind(window.didManager);
    window.didManager.init = async function () {
        await originalInit();
        await applyRole();
    };

    // Floating switcher UI
    window.addEventListener('DOMContentLoaded', () => {
        const box = document.createElement('div');
        box.id = 'role-switcher-box';
        box.style.cssText =
            'position:fixed;bottom:16px;left:16px;z-index:99999;' +
            'background:var(--glass-bg, rgba(255,255,255,0.9));' +
            'backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);' +
            'color:var(--text-primary, #0f172a);padding:8px 14px;border-radius:14px;' +
            'font:600 13px "Plus Jakarta Sans", sans-serif;' +
            'border:1px solid var(--glass-border, rgba(0,0,0,0.1));' +
            'box-shadow:var(--shadow-lg, 0 8px 24px rgba(0,0,0,0.1));' +
            'display:flex;align-items:center;gap:8px;';
        box.innerHTML =
            '<span>Role:</span>' +
            '<select id="roleSel" style="background:var(--bg-muted, #f1f5f9);color:var(--text-primary, #0f172a);border:1px solid var(--border-subtle, #e2e8f0);border-radius:8px;padding:4px 8px;font:inherit;font-size:12px;font-weight:600;cursor:pointer;outline:none;">' +
            '<option value="student">Student (Holder)</option>' +
            '<option value="issuer">University (Issuer)</option></select>';
        document.body.appendChild(box);

        const sel = box.querySelector('#roleSel');
        sel.value = getRole();
        sel.addEventListener('change', async () => {
            localStorage.setItem(KEY, sel.value);
            await applyRole();
            location.reload();
        });
    });
})();
