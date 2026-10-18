# EDGER Lights UI — Uiverse.io Snippet
**Coleção:** EDGER Lights UI  
**Assinatura:** *Soft Colors. Sharp Edges.*  
**Componente:** `EDGER Lights — Notification Card (Layered 3D Offset & Tactile Buttons)`

---

## 1. Código HTML (Uiverse HTML Tab)

```html
<!-- MODELO 1: Variação Borda Lateral (Lateral Edge) -->
<div class="edger-card edger-card--lateral edger-rose">
  <div class="edger-content">
    <!-- Squircle Badge com Efeito de Luz Interna -->
    <div class="edger-squircle">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
      </svg>
    </div>

    <!-- Corpo de Texto e Ações -->
    <div class="edger-body">
      <div class="edger-header">
        <div class="edger-title-wrap">
          <h4 class="edger-title">Notificação Crítica de Cofre</h4>
          <span class="edger-pulse-dot"></span>
        </div>
        <span class="edger-timestamp">há 2 min</span>
      </div>

      <p class="edger-description">
        Tentativa de rotação de chaves detectada no cofre operacional. Requer validação multi-sig imediata para liberação de fundos.
      </p>

      <div class="edger-actions">
        <button class="edger-btn edger-btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
          Revisar Transação
        </button>
        <button class="edger-btn edger-btn-ghost">Descartar</button>
      </div>
    </div>
  </div>
</div>

<!-- MODELO 2: Variação Borda Inferior (Bottom Edge 3D Offset) -->
<div class="edger-card edger-card--bottom edger-sky">
  <div class="edger-content">
    <div class="edger-squircle">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 3s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
      </svg>
    </div>
    <div class="edger-body">
      <div class="edger-header">
        <div class="edger-title-wrap">
          <h4 class="edger-title">Proposta de Governança Aberta</h4>
        </div>
        <span class="edger-timestamp">há 3 horas</span>
      </div>
      <p class="edger-description">
        Votação aberta para a proposta #27 da DAO: Expansão do programa de associados institucionais.
      </p>
      <div class="edger-actions">
        <button class="edger-btn edger-btn-primary">Votar Agora</button>
        <button class="edger-btn edger-btn-ghost">Detalhes</button>
      </div>
    </div>
  </div>
</div>
```

---

## 2. Código CSS (Uiverse CSS Tab)

```css
/* ==========================================================================
   EDGER Lights UI — Soft Colors. Sharp Edges.
   ========================================================================== */

/* Variáveis de Tema (Rose / Notificação Crítica) */
.edger-rose {
  --edger-bg: #fff5f5;
  --edger-border: #fecdd3;
  --edger-accent: #e11d48;
  --edger-accent-hover: #be123c;
  --edger-text: #9f1239;
  --edger-subtext: #be123c;
  --edger-badge-bg: linear-gradient(135deg, #ffe4e6 0%, #fecdd3 100%);
  --edger-shadow: rgba(225, 29, 72, 0.22);
}

/* Suporte Automático a Variações (Amber, Emerald, Sky, Purple, Slate) */
.edger-amber {
  --edger-bg: #fffbeb;
  --edger-border: #fde68a;
  --edger-accent: #d97706;
  --edger-accent-hover: #b45309;
  --edger-text: #92400e;
  --edger-subtext: #b45309;
  --edger-badge-bg: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  --edger-shadow: rgba(217, 119, 6, 0.22);
}

.edger-emerald {
  --edger-bg: #f0fdf4;
  --edger-border: #a7f3d0;
  --edger-accent: #059669;
  --edger-accent-hover: #047857;
  --edger-text: #065f46;
  --edger-subtext: #047857;
  --edger-badge-bg: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  --edger-shadow: rgba(5, 150, 105, 0.22);
}

.edger-sky {
  --edger-bg: #f0f9ff;
  --edger-border: #bae6fd;
  --edger-accent: #0284c7;
  --edger-accent-hover: #0369a1;
  --edger-text: #075985;
  --edger-subtext: #0369a1;
  --edger-badge-bg: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
  --edger-shadow: rgba(2, 132, 199, 0.22);
}

/* Estrutura Base do Card */
.edger-card {
  position: relative;
  width: 100%;
  max-width: 520px;
  background-color: var(--edger-bg);
  border: 1.5px solid var(--edger-border);
  border-radius: 16px;
  overflow: hidden;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}

/* MODELO 1: Borda Lateral (Lateral Edge) */
.edger-card--lateral {
  box-shadow: -4.5px 0 0 0 var(--edger-accent), -6px 10px 22px -3px var(--edger-shadow);
}

.edger-card--lateral:hover {
  transform: translateX(2px) translateY(-1px);
  box-shadow: -6.5px 0 0 0 var(--edger-accent), -10px 14px 26px -3px var(--edger-shadow);
}

/* MODELO 2: Borda Inferior (Bottom Edge 3D) */
.edger-card--bottom {
  box-shadow: 0 4.5px 0 0 var(--edger-accent), 0 10px 20px -3px var(--edger-shadow);
}

.edger-card--bottom:hover {
  transform: translateY(-2px);
  box-shadow: 0 6.5px 0 0 var(--edger-accent), 0 14px 24px -3px var(--edger-shadow);
}

/* Conteúdo */
.edger-content {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 22px 24px;
}

/* Squircle Badge com Bevel Interno */
.edger-squircle {
  width: 48px;
  height: 48px;
  min-width: 48px;
  border-radius: 17px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--edger-badge-bg);
  border: 1.5px solid var(--edger-border);
  color: var(--edger-accent);
  box-shadow: inset 0 1px 1.5px rgba(255, 255, 255, 0.95), 0 4px 10px var(--edger-shadow);
  transition: transform 0.25s ease;
}

.edger-card:hover .edger-squircle {
  transform: scale(1.05);
}

/* Corpo de Texto */
.edger-body {
  flex-grow: 1;
  min-width: 0;
}

.edger-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}

.edger-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.edger-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--edger-text);
  letter-spacing: -0.01em;
}

/* Dot Pulsante */
.edger-pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--edger-accent);
  box-shadow: 0 0 0 3px var(--edger-border);
  animation: edgerDotPulse 2s infinite ease-in-out;
}

@keyframes edgerDotPulse {
  0% { transform: scale(0.95); opacity: 0.9; }
  50% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.9; }
}

.edger-timestamp {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--edger-subtext);
  opacity: 0.85;
}

.edger-description {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.55;
  color: var(--edger-subtext);
}

/* Ações e Botões EDGER */
.edger-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
}

.edger-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 0.82rem;
  font-weight: 650;
  padding: 7px 14px;
  border-radius: 9px;
  cursor: pointer;
  border: 1.5px solid transparent;
  transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
}

.edger-btn-primary {
  background: rgba(255, 255, 255, 0.8);
  border-color: var(--edger-border);
  color: var(--edger-text);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.04), inset 0 1px 1px #ffffff;
}

.edger-btn-primary:hover {
  transform: translateY(-1.5px);
  background: #ffffff;
  border-color: var(--edger-accent);
  box-shadow: 0 5px 12px var(--edger-shadow), inset 0 1px 1.5px #ffffff;
}

.edger-btn-primary:active {
  transform: translateY(1px) scale(0.98);
}

.edger-btn-ghost {
  background: transparent;
  border-color: transparent;
  color: var(--edger-subtext);
}

.edger-btn-ghost:hover {
  background: rgba(0, 0, 0, 0.04);
  color: var(--edger-text);
}
```
