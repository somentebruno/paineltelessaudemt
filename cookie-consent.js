(function () {
    const COOKIE_KEY = 'uysi_cookie_consent';

    function init() {
        if (localStorage.getItem(COOKIE_KEY)) {
            setupFooterListener();
            return;
        }
        setTimeout(renderBanner, 1000);
        setupFooterListener();
    }

    function renderBanner() {
        if (document.getElementById('cookie-banner')) return;
        const html = `
            <div id="cookie-banner" class="cookie-banner-container">
                <div class="cookie-banner-content">
                    <button id="cc-close-banner" class="cc-close-btn" aria-label="Fechar">✕</button>
                    <p>Utilizamos cookies para melhorar sua experiência e direcionamento. Acesse nossa <a href="https://uysi.vercel.app/lgpd" target="_blank">Central de Privacidade</a> para saber como processamos dados.</p>
                    <div class="cookie-actions">
                        <button id="cc-accept" class="cc-btn cc-btn-primary">Aceitar</button>
                        <button id="cc-reject" class="cc-btn cc-btn-secondary">Recusar</button>
                        <button id="cc-manage" class="cc-btn cc-btn-link">Gerenciar Cookies</button>
                    </div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
        document.getElementById('cc-accept').onclick = () => save({ essential: true, performance: true, functional: true, security: true });
        document.getElementById('cc-reject').onclick = () => save({ essential: true, performance: false, functional: false, security: false });
        document.getElementById('cc-close-banner').onclick = () => save({ essential: true, performance: false, functional: false, security: false });
        document.getElementById('cc-manage').onclick = (e) => { e.preventDefault(); renderModal(); };
    }

    function renderModal() {
        const banner = document.getElementById('cookie-banner');
        if (banner) banner.remove();
        if (document.getElementById('cookie-modal')) return;

        const html = `
            <div id="cookie-modal" class="cookie-modal-overlay">
                <div class="cookie-modal-backdrop"></div>
                <div class="cookie-modal-card">
                    <button id="cc-modal-close" class="cc-modal-close-btn">✕</button>
                    
                    <div class="cc-modal-header">
                        <h3>Preferências de Cookies</h3>
                        <p>Personalize as tecnologias de rastreamento do site. Suas escolhas serão processadas estritamente de acordo com a LGPD.</p>
                    </div>

                    <div class="cc-modal-body">
                        <!-- Essenciais -->
                        <div class="cc-option-card cc-bg-gray">
                            <div class="cc-option-row">
                                <h4>Estritamente Necessários</h4>
                                <span class="cc-badge-active">
                                    <span class="cc-dot"></span> Sempre Ativo
                                </span>
                            </div>
                            <p class="cc-desc">Essenciais para o funcionamento básico, segurança e sessão do usuário. Não podem ser inativados.</p>
                        </div>

                        <!-- Performance -->
                        <div class="cc-option-card">
                            <div class="cc-option-row">
                                <h4>Desempenho e Análise</h4>
                                <label class="cc-switch"><input type="checkbox" id="cc-p-perf"><span class="cc-slider"></span></label>
                            </div>
                            <p class="cc-desc">Coletam métricas de navegação anonimizadas para otimizar velocidade e UI.</p>
                        </div>

                        <!-- Funcional -->
                        <div class="cc-option-card">
                            <div class="cc-option-row">
                                <h4>Funcionalidade e Personalização</h4>
                                <label class="cc-switch"><input type="checkbox" id="cc-p-func"><span class="cc-slider"></span></label>
                            </div>
                            <p class="cc-desc">Memorizam suas escolhas locais e integram recursos avançados de sistema.</p>
                        </div>

                        <!-- Segurança -->
                        <div class="cc-option-card">
                            <div class="cc-option-row">
                                <h4>Segurança Avançada</h4>
                                <label class="cc-switch"><input type="checkbox" id="cc-p-sec"><span class="cc-slider"></span></label>
                            </div>
                            <p class="cc-desc">Validação extra de bots, prevenção de ataques e proteção de credenciais.</p>
                        </div>
                    </div>

                    <div class="cc-modal-footer">
                        <button id="cc-save-prefs" class="cc-btn cc-btn-outline">Salvar Minhas Preferências</button>
                        <button id="cc-accept-all" class="cc-btn cc-btn-dark">Aceitar Todos</button>
                    </div>
                </div>
            </div>`;

        document.body.insertAdjacentHTML('beforeend', html);

        // Handlers
        document.querySelector('.cookie-modal-backdrop').onclick = closeModal;
        document.getElementById('cc-modal-close').onclick = closeModal;

        // Restaurar preferências salvas nos checkboxes
        const saved = JSON.parse(localStorage.getItem(COOKIE_KEY) || 'null');
        if (saved) {
            document.getElementById('cc-p-perf').checked = !!saved.performance;
            document.getElementById('cc-p-func').checked = !!saved.functional;
            document.getElementById('cc-p-sec').checked  = !!saved.security;
        }

        document.getElementById('cc-accept-all').onclick = () => save({ essential: true, performance: true, functional: true, security: true });

        document.getElementById('cc-save-prefs').onclick = () => {
            save({
                essential: true,
                performance: document.getElementById('cc-p-perf').checked,
                functional: document.getElementById('cc-p-func').checked,
                security: document.getElementById('cc-p-sec').checked
            });
        };
    }

    function closeModal() {
        document.getElementById('cookie-modal').remove();
        if (!localStorage.getItem(COOKIE_KEY)) renderBanner();
    }

    function save(prefs) {
        localStorage.setItem(COOKIE_KEY, JSON.stringify(prefs));
        if (document.getElementById('cookie-banner')) document.getElementById('cookie-banner').remove();
        if (document.getElementById('cookie-modal')) document.getElementById('cookie-modal').remove();
    }

    function setupFooterListener() {
        const btn = document.getElementById('footer-cookie-prefs');
        if (btn) btn.onclick = (e) => { e.preventDefault(); renderModal(); };
    }

    init();
})();
