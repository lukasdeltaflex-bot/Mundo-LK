# Diretriz Permanente de Arquitetura — Mundo LK Enterprise

## 🏛️ Política de Integridade, IA 100% Real e Proibição Absoluta de Mocks

Esta diretriz estabelece a política inegociável de qualidade, confiabilidade e transparência técnica do **Mundo LK Enterprise**. Todo desenvolvedor, módulo, serviço ou integração atual e futuro DEVE obedecer rigorosamente a estes princípios.

---

### 1. IA 100% Real
- Todas as funcionalidades de Inteligência Artificial utilizam exclusivamente a API oficial do **Google Gemini** (`gemini-2.5-flash`).
- **É expressamente proibida a utilização de:**
  - Mocks ou dados fictícios.
  - Respostas estáticas pré-programadas.
  - Placeholders apresentados como se fossem inteligência real.
  - Funções temporárias ou simulações de sucesso.

### 2. Transparência Técnica & Tratamento de Erros
- Se uma API de integração, banco de dados ou serviço de IA estiver indisponível ou com limite de cota excedido (ex: `HTTP 429`), o sistema **DEVE informar o evento com clareza e transparência ao usuário**.
- É proibido fabricar resultados fictícios para disfarçar falhas de infraestrutura.

### 3. Conexões Oficiais de Marketplaces
- Toda comunicação com os marketplaces **Mercado Livre** e **Shopee** utiliza exclusivamente a **Marketplace Access Gateway** através de APIs oficiais, OAuth 2.0 e assinaturas HMAC-SHA256, sem recorrer a métodos não autorizados ou scraping.

### 4. Auditoria Permanente na Central de Diagnóstico
- O módulo **Centro de Diagnóstico Inteligente** (`SystemDiagnosticService.ts`) executa varreduras contínuas no sistema para monitorar a integridade da IA, conexões de banco de dados e APIs oficiais, emitindo alertas automáticos em caso de inconformidades.

---
*Mundo LK Enterprise v4.0 — Garantia de Confiabilidade e Integridade de Dados.*
