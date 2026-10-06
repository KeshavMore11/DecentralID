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
        box.style.cssText =
            'position:fixed;bottom:12px;left:12px;z-index:99999;background:#1c1c1e;' +
            'color:#fff;padding:8px 12px;border-radius:12px;font:13px sans-serif;' +
            'border:1px solid #333;';
        box.innerHTML =
            'Role: <select id="roleSel" style="background:#2c2c2e;color:#fff;border:0;border-radius:6px;padding:2px 6px">' +
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
