# SGPD (Sistema de Gestão de Passagens e Diárias) - Project Plan

## Overview
O SGPD é um sistema governamental para a SEFA controlar solicitações, aprovações, execução financeira e prestação de contas de viagens de servidores. O fluxo de aprovação é estrito (Chefia -> Secretário/Subsecretário -> DAD -> Financeiro) e o prazo de prestação de contas é de 5 dias úteis (Decreto nº 3.792/2024). Diárias são calculadas via tabela legal (Decreto nº 4.025/2024). Nesta primeira versão, a IA atuará em regras de negócio básicas com entrada manual para validação de recibos, não por OCR; a autenticação será via e-mail corporativo (`@sefa.pa.gov.br`), e a hierarquia funcional tratará mudanças dinâmicas de cargos via RLS.

## Project Type
**WEB** (React, Vite, Tailwind CSS, Supabase PostgreSQL/Auth)

## Success Criteria
1. Servidores podem solicitar viagens e seus chefes imediatos podem aprovar ou rejeitar.
2. Servidores conseguem prestar contas no sistema declarando valores, respeitando o limite de 5 dias úteis.
3. O sistema calcula automaticamente o valor previsto de diárias baseado em destino/cargo.
4. O sistema valida regras de negócio com suporte de um agente/regras baseadas em texto ou lógica estrita, sugerindo a aprovação.
5. Apenas e-mails `@sefa.pa.gov.br` podem criar contas ou fazer login.
6. A segurança de nível de linha (RLS) garante que apenas os envolvidos (solicitante, chefia atual, e DAD) acessem a viagem.

## Tech Stack
- **Frontend:** React (Vite) + Tailwind CSS (para um layout premium, corporativo e responsivo)
- **Backend/Database:** Supabase (PostgreSQL para dados, Storage para PDFs de bilhetes e recibos, Auth para e-mail/senha)
- **Regras de Negócio/IA Restrita:** Edge Functions (Supabase) ou lógica no client/server para cruzar valores solicitados vs tabela legal do Decreto 4025/2024.

## File Structure (Partial)
```text
/
├── src/
│   ├── components/       # Componentes React reutilizáveis (UI)
│   ├── pages/            # Telas (Dashboard, Solicitação, Aprovação, Prestação de Contas)
│   ├── hooks/            # Hooks customizados para Supabase Auth/Queries
│   ├── lib/              # Configuração Supabase e utilitários
│   ├── styles/           # Tailwind / global.css
│   └── App.tsx           # Roteamento
├── supabase/
│   ├── migrations/       # Migrations de banco de dados e RLS
│   └── functions/        # Edge Functions
└── package.json
```

## Task Breakdown

### 1. Configuração Inicial e Banco de Dados (Foundation)
- **Agent:** `database-architect` | **Skill:** `database-design`
- **Priority:** P0
- **INPUT:** Especificações do SGPD (Cargos dinâmicos, fluxo de viagem e prestação de contas).
- **OUTPUT:** Migrations SQL com tabelas `profiles`, `roles`, `travel_requests`, `expenses` e `tables_decrees`. Políticas RLS implementadas. Trigger de verificação de domínio de email (`@sefa.pa.gov.br`).
- **VERIFY:** Login falha para domínios externos; Usuário salva viagem e consegue visualizar, mas outro usuário sem cargo não vê.
- **Dependencies:** None

### 2. Autenticação e Restrição de Acesso
- **Agent:** `security-auditor` | **Skill:** `api-patterns`
- **Priority:** P0
- **INPUT:** Tabelas criadas. Regra de sufixo corporativo.
- **OUTPUT:** Fluxo Auth UI (React) + bloqueio de login final com Supabase.
- **VERIFY:** Login de teste@sefa.pa.gov.br tem sucesso. teste@gmail.com é rejeitado ou bloqueado.
- **Dependencies:** Task 1

### 3. Engine de Cálculo de Diárias e Regra de 5 Dias
- **Agent:** `backend-specialist` | **Skill:** `nodejs-best-practices`
- **Priority:** P1
- **INPUT:** Decreto nº 4.025/2024 e Decreto nº 3.792/2024.
- **OUTPUT:** Lógica (Supabase RPCs ou TypeScript Utils) para (a) calcular o teto de diárias por destino/cargo, (b) bloquear prestação de conta > 5 dias úteis pós-retorno. 
- **VERIFY:** Simular viagem de 2 dias e checar teto; Simular tentativa de fechar prestação no D+6 (deve exibir erro ou flaggar atraso).
- **Dependencies:** Task 1

### 4. UI: Dashboard e Novo Pedido de Viagem
- **Agent:** `frontend-specialist` | **Skill:** `frontend-design`
- **Priority:** P2
- **INPUT:** UI/UX specs.
- **OUTPUT:** Layout principal, Sidebars, página de nova requisição acoplada ao Supabase inserindo na tabela `travel_requests`.
- **VERIFY:** Criar viagem no front -> Verifica linha no Supabase.
- **Dependencies:** Task 1, Task 2

### 5. UI: Fluxo de Aprovação e Prestação de Contas
- **Agent:** `frontend-specialist` | **Skill:** `frontend-design`
- **Priority:** P2
- **INPUT:** Tabela de viagens.
- **OUTPUT:** Tela de "Minhas Pendências" (Chefia/DAD) com botões de Aprovar/Rejeitar. Tela de Prestação de Contas (inputs manuais de recibos) chamando a task 3.
- **VERIFY:** Chefe muda status para "Aprovado", Servidor preenche "Valor Gasto" e status muda para "Em Prestação".
- **Dependencies:** Task 4, Task 3

### 6. IA / Business Rule Alertas
- **Agent:** `backend-specialist` | **Skill:** `architecture`
- **Priority:** P2
- **INPUT:** Dados inseridos da prestação de contas manual x limites da tabela legal.
- **OUTPUT:** Alerta na tela da DAD/Chefia via IA Textual ou lógicas de auditoria de que "Gastos excedem tabela" ou "Aprovado sem ressalvas".
- **VERIFY:** Inserir 1500 na prestação (teto era 1000) -> DAD vê tooltip de aviso.
- **Dependencies:** Task 5

## ✅ PHASE X COMPLETE
*To be filled after implementation and verification*
- Lint: [ ] Pass
- Security: [ ] No critical issues
- Build: [ ] Success
- Date: [ ]
