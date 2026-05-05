// cookie-consent.js
(function () {
    const COOKIE_KEY = 'uysi_cookie_consent';

    const defaultPrefs = {
        essential: true,
        performance: false,
        functional: false,
        security: false
    };

    function init() {
        if (localStorage.getItem(COOKIE_KEY)) {
            setupFooterListener();
            return;
        }

        setTimeout(() => {
            renderBanner();
            setupFooterListener();
        }, 1000);
    }

    function renderBanner() {
        if (document.getElementById('cookie-banner')) return;

        const bannerHtml = `
            <div id="cookie-banner" class="cookie-banner-container">
                <div class="cookie-banner-content">
                    <p>Utilizamos cookies para melhorar sua experiência. Acesse nossa <a href="/lgpd">Central de Privacidade</a>.</p>
                    <div class="cookie-actions">
                        <button id="btn-accept-all" class="btn-primary">Aceitar</button>
                        <button id="btn-reject-all" class="btn-secondary">Recusar</button>
                        <button id="btn-manage" class="btn-link">Gerenciar</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', bannerHtml);

        document.getElementById('btn-accept-all').onclick = () => savePrefs({ essential: true, performance: true, functional: true, security: true });
        document.getElementById('btn-reject-all').onclick = () => savePrefs({ essential: true, performance: false, functional: false, security: false });
        document.getElementById('btn-manage').onclick = renderModal;
    }

    function renderModal() {
        // Remove banner temporariamente se estiver aberto
        const banner = document.getElementById('cookie-banner');
        if (banner) banner.remove();

        const modalHtml = `
            <div id="cookie-modal" class="cookie-modal-overlay">
                <div class="cookie-modal-card">
                    <h3>Preferências de Cookies</h3>
                    <div class="cookie-option">
                        <span>Estritamente Necessários (Sempre Ativo)</span>
                    </div>
                    <div class="cookie-option">
                        <label>Desempenho e Análise</label>
                        <input type="checkbox" id="pref-performance">
                    </div>
                    <!-- Adicione as outras opções aqui -->
                    <div class="modal-actions">
                        <button id="btn-save-prefs">Salvar Preferências</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        document.getElementById('btn-save-prefs').onclick = () => {
            const prefs = {
                essential: true,
                performance: document.getElementById('pref-performance').checked,
                // ... pegar outros checkboxes
            };
            savePrefs(prefs);
            document.getElementById('cookie-modal').remove();
        };
    }

    function savePrefs(prefs) {
        localStorage.setItem(COOKIE_KEY, JSON.stringify(prefs));
        const banner = document.getElementById('cookie-banner');
        if (banner) banner.remove();
        const modal = document.getElementById('cookie-modal');
        if (modal) modal.remove();
    }

    function setupFooterListener() {
        const trigger = document.getElementById('footer-cookie-prefs');
        if (trigger) {
            trigger.onclick = (e) => {
                e.preventDefault();
                renderModal();
            };
        }
    }

    init();
})();
