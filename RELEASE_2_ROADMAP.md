# Roadmap de Evolução Técnica — Release 2 (Enterprise Scale)

Este documento estabelece o plano de evolução técnica e arquitetural do **Affiliate Operations Hub** para o **Release 2**, expandindo o MVP entregue no Release 1.

---

## 1. Visão Geral do Release 1 Entregue (Baseline)

* ✅ Rota modular `/operacao` com orquestrador UI limpo.
* ✅ Diagnóstico de credenciais do servidor (`process.env`) em tempo real.
* ✅ Pipeline de Resolução Inteligente em 6 Níveis no `ImportEngine.ts`.
* ✅ Regra anti-dados-falsos com conferência manual (`ProductReviewModal.tsx`).
* ✅ AI Engine desacoplado com suporte a Gemini 2.5 Flash / GPT-4o e degradação graciosa.
* ✅ Media Studio vinculado à entidade `Offer` (Feed 1:1, Story 9:16, Banner Horizontal, Pin).
* ✅ Persistência multi-tenant nos repositórios Firestore (`products` e `offers`).
* ✅ Publicação assíncrona de eventos no `DomainEventBus`.
* ✅ Disparo automático do painel pós-salvar em 1 clique (`PublishPanelModal.tsx`).

---

## 2. Pilares de Evolução Recomendados para o Release 2

### A. Analytics Avançado & BI Comercial
* **Métricas de Performance**: Métricas de cliques reais por oferta, taxas de conversão por canal e comissão acumulada.
* **Heatmap de Horários**: Identificação automatizada dos melhores horários de postagem com base no histórico de engajamento do público.

### B. Automação de Disparos & Filas Assíncronas
* **Filas Background (BullMQ / Cloud Tasks)**: Processamento de disparos em lote sem travar a interface do usuário.
* **Agendamento Recorrente Real**: Cron jobs configuráveis para repostagem periódica de ofertas campeãs de vendas.

### C. Integrações Oficiais com APIs das Redes Sociais
* **Meta Graph API**: Publicação direta via API no Instagram Feed/Stories e Páginas do Facebook.
* **Telegram Bot API**: Envio direto com bot dedicado para Canais e Grupos com botões inline formatados.
* **WhatsApp Cloud API**: Envio automatizado para listas de transmissão e canais do WhatsApp.

### D. Reuso de Inteligência & Repositório de Prompts
* **Prompt Engineering Studio**: Configuração de tom de voz personalizado por marca/afiliado.
* **Teste A/B de Copys**: Geração simultânea de 3 variações de texto para identificação da copy com maior CTR.
