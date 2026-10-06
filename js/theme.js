/**
 * Theme Manager
 * Supports Light Mode (default) and Dark Mode with instant toggle and local persistence.
 */
(function () {
    const THEME_KEY = 'ssi_theme';
    const getSavedTheme = () => localStorage.getItem(THEME_KEY) || 'light';

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        updateToggleBtn(theme);
    }

    function updateToggleBtn(theme) {
        const btn = document.getElementById('theme-toggle-btn');
        if (!btn) return;
        const isDark = theme === 'dark';
        btn.setAttribute('data-theme-state', theme);
        btn.innerHTML = `
            <span class="theme-toggle-icon">${isDark ? '☀️' : '🌙'}</span>
            <span class="theme-toggle-text">${isDark ? 'Light' : 'Dark'}</span>
        `;
        btn.title = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    }

    window.toggleTheme = function () {
        const current = document.documentElement.getAttribute('data-theme') || getSavedTheme();
        const next = current === 'dark' ? 'light' : 'dark';
        localStorage.setItem(THEME_KEY, next);
        applyTheme(next);
    };

    // Apply theme immediately to prevent flashing
    applyTheme(getSavedTheme());

    // Inject theme toggle button into DOM
    window.addEventListener('DOMContentLoaded', () => {
        applyTheme(getSavedTheme());

        if (!document.getElementById('theme-toggle-btn')) {
            const toggleBtn = document.createElement('button');
            toggleBtn.id = 'theme-toggle-btn';
            toggleBtn.className = 'theme-toggle-btn';
            toggleBtn.onclick = window.toggleTheme;
            document.body.appendChild(toggleBtn);
            updateToggleBtn(getSavedTheme());
        }
    });
})();
