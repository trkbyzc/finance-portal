<#macro registrationLayout bodyClass="" displayInfo=false displayMessage=true displayRequiredFields=false compact=false>
<!DOCTYPE html>
<html lang="${(locale.currentLanguageTag)!'tr'}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>FinansPortal — Tüm Piyasalar Tek Ekranda</title>

    <#-- FOUC önlemi: CSS yüklenmeden önce data-theme set edilsin -->
    <script>
        (function () {
            try {
                var t = localStorage.getItem('kc-theme');
                if (t !== 'dark' && t !== 'light' && t !== 'hybrid') t = 'dark';
                document.documentElement.setAttribute('data-theme', t);
            } catch (e) {
                document.documentElement.setAttribute('data-theme', 'dark');
            }
        })();
    </script>

    <#if properties.styles?has_content>
        <#list properties.styles?split(' ') as style>
            <link href="${url.resourcesPath}/${style}" rel="stylesheet" />
        </#list>
    </#if>

    <#-- Şifre göster/gizle (göz) toggle stili -->
    <style>
        .kc-password-wrap { position: relative; display: block; }
        .kc-password-wrap .kc-input { width: 100%; padding-right: 44px; }
        .kc-password-toggle {
            position: absolute; top: 50%; right: 10px; transform: translateY(-50%);
            display: inline-flex; align-items: center; justify-content: center;
            width: 28px; height: 28px; padding: 0;
            background: transparent; border: none; cursor: pointer;
            color: #94a3b8; transition: color .15s;
        }
        .kc-password-toggle:hover { color: #2563eb; }
        .kc-password-toggle .kc-eye { width: 20px; height: 20px; }

        /* Alan (field) hata mesajı — yanlış giriş / mevcut kullanıcı-email vb. */
        .kc-field-error {
            display: block;
            margin-top: 6px;
            font-size: 12.5px;
            font-weight: 600;
            color: #ef4444;
            line-height: 1.3;
        }
    </style>
</head>

<body class="kc-page ${bodyClass}<#if compact> kc-compact</#if>">

    <#-- Toolbar: tema + dil -->
    <div class="kc-toolbar">
        <button id="kc-theme-toggle" type="button" class="kc-toolbar-btn" aria-label="${msg('themeToggleLabel')}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="4"></circle>
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path>
            </svg>
            <span id="kc-theme-label">Dark</span>
        </button>
        <#if realm.internationalizationEnabled && locale?? && locale.supported?? && (locale.supported?size > 1)>
            <div class="kc-lang-group" role="group" aria-label="${msg('langToggleLabel')}">
                <#list locale.supported as l>
                    <a class="kc-lang-link <#if l.languageTag == (locale.currentLanguageTag)!''>active</#if>" href="${l.url}">${l.languageTag?upper_case}</a>
                </#list>
            </div>
        </#if>
    </div>

    <#if compact>
    <#-- Compact mod (örn. çıkış onayı): sol tanıtım paneli yok, sadece ortada kart + bulanık zemin -->
    <style>
        .kc-compact .kc-split { display: none; }
        .kc-compact-wrap {
            position: relative;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
        }
        .kc-compact-wrap::before {
            content: '';
            position: fixed;
            inset: 0;
            background: radial-gradient(120% 120% at 50% 30%, rgba(37, 99, 235, 0.22), transparent 60%);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            pointer-events: none;
        }
        .kc-compact .kc-form-card {
            position: relative;
            z-index: 2;
            max-width: 440px;
            width: 100%;
        }
    </style>
    <main class="kc-compact-wrap">
        <div class="kc-form-card">
            <#if displayMessage && message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
                <div class="kc-alert kc-alert-${message.type}">
                    ${kcSanitize(message.summary)?no_esc}
                </div>
            </#if>
            <#nested "header">
            <#nested "form">
            <#if displayInfo>
                <#nested "info">
            </#if>
        </div>
    </main>
    <#else>
    <div class="kc-split">

        <#-- Sol: Brand panel + animated chart -->
        <aside class="kc-brand-panel">
            <a class="kc-brand-header" href="http://localhost:5173" aria-label="FinansPortal">
                <svg class="kc-brand-logo" viewBox="0 0 44 42" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <defs>
                        <linearGradient id="kcLogoGrad" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stop-color="#2563eb"/>
                            <stop offset="100%" stop-color="#1d4ed8"/>
                        </linearGradient>
                    </defs>
                    <rect x="2" y="2" width="40" height="38" rx="10" fill="url(#kcLogoGrad)"/>
                    <path d="M10 28 L17 21 L22 25 L34 13" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                    <circle cx="34" cy="13" r="2.6" fill="#ffffff"/>
                </svg>
                <div class="kc-brand-name">Finans<span class="kc-brand-name-accent">Portal</span></div>
            </a>

            <h1 class="kc-brand-headline">${msg('brandHeadline')}</h1>
            <p class="kc-brand-tagline">${msg('brandTagline')}</p>

            <ul class="kc-brand-bullets">
                <li>
                    <span class="kc-bullet-dot">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </span>
                    <span>${msg('bulletRealtime')}</span>
                </li>
                <li>
                    <span class="kc-bullet-dot">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </span>
                    <span>${msg('bulletPortfolio')}</span>
                </li>
            </ul>

            <#-- Animated chart mockup -->
            <div class="kc-chart-wrap">
                <div class="kc-chart-header">
                    <span class="kc-chart-symbol">XU100 / BIST 100</span>
                    <span id="kc-chart-pct" class="kc-chart-change">...%</span>
                </div>
                <svg class="kc-chart" viewBox="0 0 400 160" preserveAspectRatio="none" aria-hidden="true">
                    <defs>
                        <linearGradient id="kcAreaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stop-color="#2563eb" stop-opacity="0.4"/>
                            <stop offset="100%" stop-color="#2563eb" stop-opacity="0"/>
                        </linearGradient>
                    </defs>
                    <line class="kc-chart-grid" x1="0" y1="40"  x2="400" y2="40"/>
                    <line class="kc-chart-grid" x1="0" y1="80"  x2="400" y2="80"/>
                    <line class="kc-chart-grid" x1="0" y1="120" x2="400" y2="120"/>
                    <path class="kc-chart-area"
                          d="M0,130 L40,118 L80,124 L120,100 L160,108 L200,86 L240,72 L280,78 L320,52 L360,38 L400,22 L400,160 L0,160 Z"/>
                    <polyline class="kc-chart-line"
                              points="0,130 40,118 80,124 120,100 160,108 200,86 240,72 280,78 320,52 360,38 400,22"/>
                    <circle class="kc-chart-dot" cx="400" cy="22" r="4"/>
                </svg>
            </div>
        </aside>

        <#-- Sağ: Form panel -->
        <main class="kc-form-panel">
            <div class="kc-form-card">

                <#-- Header (login.ftl, register.ftl vs. tarafından doldurulur) -->
                <#if displayMessage && message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
                    <div class="kc-alert kc-alert-${message.type}">
                        ${kcSanitize(message.summary)?no_esc}
                    </div>
                </#if>

                <#nested "header">

                <#nested "form">

                <#if displayInfo>
                    <#nested "info">
                </#if>
            </div>
        </main>

    </div>
    </#if>

    <#-- Theme toggle + locale switcher JS -->
    <script>
        (function () {
            var order = ['dark', 'light', 'hybrid'];
            var labels = { dark: 'Dark', light: 'Light', hybrid: 'Hybrid' };
            var btn = document.getElementById('kc-theme-toggle');
            var lbl = document.getElementById('kc-theme-label');
            function applyLabel() {
                var cur = document.documentElement.getAttribute('data-theme') || 'dark';
                if (lbl) lbl.textContent = labels[cur] || 'Dark';
            }
            applyLabel();
            if (btn) {
                btn.addEventListener('click', function () {
                    var cur = document.documentElement.getAttribute('data-theme') || 'dark';
                    var next = order[(order.indexOf(cur) + 1) % order.length];
                    document.documentElement.setAttribute('data-theme', next);
                    try { localStorage.setItem('kc-theme', next); } catch (e) {}
                    applyLabel();
                });
            }
        })();

        // BIST 100 gerçek veri — backend public endpoint'ten çek, SVG'yi güncelle
        (function () {
            var API = 'http://localhost:8081/api/v1/market-data/historical?symbol=XU100.IS&category=INDEX&range=1y&interval=1d';
            fetch(API)
                .then(function (r) { return r.json(); })
                .then(function (data) {
                    if (!data || data.length < 2) return;
                    var prices = data.map(function (d) { return parseFloat(d.close || d.price || 0); })
                                     .filter(function (p) { return p > 0; });
                    if (prices.length < 2) return;
                    var minP = Math.min.apply(null, prices);
                    var maxP = Math.max.apply(null, prices);
                    var n = prices.length;
                    var PAD_TOP = 10, PAD_BOT = 150;
                    var pts = prices.map(function (p, i) {
                        return [(i / (n - 1)) * 400, PAD_BOT - (p - minP) / (maxP - minP) * (PAD_BOT - PAD_TOP)];
                    });
                    var lineStr = pts.map(function (pt) { return pt[0].toFixed(1) + ',' + pt[1].toFixed(1); }).join(' ');
                    var last = pts[pts.length - 1];
                    var areaStr = 'M' + pts.map(function (pt) { return pt[0].toFixed(1) + ',' + pt[1].toFixed(1); }).join(' L')
                                  + ' L' + last[0].toFixed(1) + ',160 L0,160 Z';
                    var svg = document.querySelector('.kc-chart');
                    if (svg) {
                        var line = svg.querySelector('.kc-chart-line');
                        var area = svg.querySelector('.kc-chart-area');
                        var dot  = svg.querySelector('.kc-chart-dot');
                        if (line) line.setAttribute('points', lineStr);
                        if (area) area.setAttribute('d', areaStr);
                        if (dot)  { dot.setAttribute('cx', last[0].toFixed(1)); dot.setAttribute('cy', last[1].toFixed(1)); }
                    }
                    var pct = (prices[prices.length - 1] - prices[0]) / prices[0] * 100;
                    var changeEl = document.getElementById('kc-chart-pct');
                    if (changeEl) {
                        changeEl.textContent = (pct >= 0 ? '+' : '') + pct.toFixed(1) + '%';
                        changeEl.style.color = pct >= 0 ? '#22c55e' : '#ef4444';
                    }
                })
                .catch(function () {}); // sessiz fail → statik grafik kalır
        })();

        // Şifre göster/gizle (göz ikonu) — tüm .kc-password-toggle butonları
        (function () {
            document.querySelectorAll('.kc-password-toggle').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    var input = document.getElementById(btn.getAttribute('data-target'));
                    if (!input) return;
                    var willShow = input.type === 'password';
                    input.type = willShow ? 'text' : 'password';
                    var open = btn.querySelector('.kc-eye-open');
                    var closed = btn.querySelector('.kc-eye-closed');
                    if (open) open.hidden = willShow;
                    if (closed) closed.hidden = !willShow;
                    btn.setAttribute('aria-label', willShow
                        ? (btn.getAttribute('data-hide-label') || '')
                        : (btn.getAttribute('data-show-label') || ''));
                });
            });
        })();
    </script>
</body>
</html>
</#macro>
