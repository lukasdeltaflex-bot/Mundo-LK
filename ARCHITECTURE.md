# Arquitetura Técnica Oficial — AffiliateOS V4

## 1. Visão Geral da Arquitetura

O **AffiliateOS V4** é um Assistente Operacional Pessoal para Afiliados construído com base nos princípios de **Clean Architecture**, **Domain-Driven Design (DDD)**, **SOLID** e a **Arquitetura Hexagonal (Ports & Adapters)**.

A aplicação foi projetada para garantir **alta coesão**, **baixo acoplamento**, **zero vazamento de abstração dos frameworks para a camada de domínio** e **testabilidade completa**.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION LAYER                            │
│           (Next.js 16 App Router, React Components, Custom Hooks)      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                          APPLICATION LAYER                             │
│       (Workflows Engine, Use Cases, Event Listeners, DTOs)             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                            DOMAIN LAYER                                │
│       (Entities, Value Objects, Domain Events, Ports/Interfaces)       │
└───────────────────────────────────▲────────────────────────────────────┘
                                    │ (Inversão de Dependências)
┌───────────────────────────────────┴────────────────────────────────────┐
│                        INFRASTRUCTURE LAYER                            │
│     (Firebase Repositories, Marketplace Adapters, Multi-AI SDKs)       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Responsabilidades por Camada

### 2.1. Domain Layer (`src/core/domain`)
- **Regra Rígida**: 100% TypeScript Puro. **PROIBIDO** importar React, Next.js, Firebase ou qualquer biblioteca visual/framework de terceiros.
- **`entities/`**: Entidades fundamentais com identidade própria (`Product`, `Offer`, `Marketplace`, `Category`, `Collection`, `Campaign`, `Tag`, `Score`, `PromptTemplate`, `AuditLog`).
- **`value-objects/`**: Objetos imutáveis com auto-validação (`Price`, `DiscountPercentage`, `AffiliateLink`, `ScoreLevel`, `ChannelContent`, `AICost`).
- **`events/`**: Definição do barramento de eventos e eventos de negócio (`IDomainEvent`, `IDomainEventBus`, `OfferCreatedEvent`).
- **`ports/`**: Interfaces de contrato para repositórios, adaptadores de marketplace, provedores de IA, filas, agendadores, motores de busca, cache, notificações, auditoria e feature flags.
- **`errors/`**: Classes de exceção do domínio (`DomainError`, `InvalidPriceError`, `InvalidLinkError`, etc.).

### 2.2. Application Layer (`src/core/application`)
- **`workflows/`**: Motores de orquestração reutilizáveis (ex: `ImportAndGenerateOfferWorkflow`). Não possuem regras de negócio nem acessam o banco de dados diretamente; orquestram a execução dos Use Cases e Portas.
- **`use-cases/`**: Ações de negócio com responsabilidade única (SRP).
- **`listeners/`**: Reações assíncronas aos eventos publicados no `EventBus` (ex: `OfferCreatedListener`).
- **`dtos/`**: Objetos de transferência de dados de entrada e saída.

### 2.3. Infrastructure Layer (`src/infrastructure`)
- **Responsabilidade**: Conectar o sistema com tecnologias externas.
- Adaptadores de **Firebase (Auth, Firestore, Storage)**, **Marketplaces (Shopee, Mercado Livre, Amazon, Magalu)**, **Provedores de IA (Gemini, OpenAI, Claude, DeepSeek)**, **Queues**, **Schedulers**, **Search Engines**, **Cache**, **Notificações** e **Audit Trail**.

### 2.4. Presentation Layer (`src/presentation` & `src/app`)
- **Responsabilidade**: Renderização da interface do usuário e captura de ações.
- `Next.js 16 App Router`, **Atomic Design System**, **Custom Hooks com TanStack Query**, **Form Wrappers com React Hook Form + Zod** e **Server Actions**.

### 2.5. Shared Layer (`src/shared`)
- Validadores Zod compartilhados, formatadores globais (BRL Currency, Date Format) e constantes da aplicação.

---

## 3. Regras de Dependência e Fronteiras

1. `Domain` **nunca** depende de nenhuma outra camada.
2. `Application` depende **apenas** do `Domain`.
3. `Infrastructure` implementa as interfaces (Ports) declaradas no `Domain`.
4. `Presentation` consome a camada `Application` (via Custom Hooks e Workflows/Use Cases).
5. Nenhuma página React pode realizar chamadas diretas aos SDKs do Firebase ou APIs externas.

---

## 4. Fluxo Futuro de Importação em 1-Clique

```
URL do Produto Colada na Interface
            │
            ▼
ImportAndGenerateOfferWorkflow.execute()
            │
            ├──► MarketplaceRegistry.getAdapterForUrl(url) ──► Retorna Adapter da Plataforma
            ├──► MarketplaceAdapter.extractProductData(url)
            ├──► ProductRepository.save(product)           ──► Salva no Catálogo Inteligente
            ├──► AIProviderAdapter.generateOfferContent()  ──► Gera Cópias + Score (0-100)
            ├──► OfferRepository.save(offer)               ──► Persiste a Oferta
            └──► DomainEventBus.publish(OfferCreatedEvent) ──► Reação Assíncrona dos Listeners
```
