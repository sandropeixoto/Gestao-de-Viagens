# GEMINI.md - SGPD Antigravity Kit

Este arquivo define o contexto instrucional e as diretrizes operacionais para o desenvolvimento do **SGPD (Sistema de Gestão de Passagens e Diárias)** para a SEFA/PA.

---

## 📋 Visão Geral do Projeto

O **SGPD** é uma solução governamental de alta fidelidade voltada para a automação e controle do fluxo de viagens corporativas. O sistema gerencia desde a solicitação inicial até a prestação de contas final, garantindo conformidade com os Decretos Estaduais (Ex: nº 4.025/2024 e nº 3.792/2024).

- **Propósito:** Gestão rigorosa de diárias, passagens e conformidade administrativa.
- **Arquitetura:** Aplicação Web moderna baseada em orquestração de agentes (AIOX).
- **Frontend:** React 19 (Vite) + Tailwind CSS 4.0 (Design Glassmorphism).
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Edge Functions).
- **Segurança:** Autenticação via e-mail corporativo (`@sefa.pa.gov.br`) e Row Level Security (RLS).

---

## 🛠️ Comandos de Build e Execução

| Ação | Comando |
| :--- | :--- |
| **Instalação** | `npm install` |
| **Desenvolvimento** | `npm run dev` |
| **Build** | `npm run build` |
| **Linting** | `npm run lint` |
| **Preview** | `npm run preview` |

---

## 🏗️ Convenções de Desenvolvimento

### 1. Metodologia AIOX
O projeto segue o framework **AIOX (Advanced Intelligent Orchestration)**:
- **Story-Driven:** O desenvolvimento é guiado por histórias de usuário em `docs/stories/`.
- **Agent Roles:** Uso de personas especializadas (Orion/Master, Dex/Dev, Quinn/QA).
- **QA Gates:** Critérios de aceitação rigorosos e validação de segurança obrigatória.

### 2. Padrões de Código
- **Tipagem:** Uso obrigatório de TypeScript (TSX).
- **Estilização:** Tailwind CSS com foco em transparência e feedback visual (Glassmorphism).
- **Validação:** Schemas Zod para formulários e validação de dados.
- **Formulários:** React Hook Form para gestão de estado complexo.
- **Segurança:** Nunca exponha segredos; confie no RLS do Supabase para proteção de dados.

### 3. Estrutura de Pastas
- `src/components/`: Componentes UI reutilizáveis e layouts.
- `src/pages/`: Telas principais (Dashboard, Wizard, Aprovações, etc.).
- `src/contexts/`: Provedores de estado global (Auth, Notifications).
- `supabase/migrations/`: Evolução do esquema do banco de dados e políticas RLS.
- `docs/`: Documentação técnica, planos de fase e histórias de usuário.

---

## ⚠️ Regras de Ouro (MANDATÓRIAS)

1. **Purple Ban:** Proibido o uso de cores roxas/violetas na UI (conforme diretrizes SEFA).
2. **Corporate Domain:** Apenas e-mails `@sefa.pa.gov.br` são permitidos no fluxo de Auth.
3. **5-Day Rule:** A prestação de contas DEVE ser iniciada em até 5 dias úteis após o retorno.
4. **Agent Priority:** Antes de qualquer alteração estrutural, leia `.agent/rules/GEMINI.md`.

---

> *"Para a SEFA, pela transparência e eficiência."* — **Orion, Master Orchestrator** 🎯
