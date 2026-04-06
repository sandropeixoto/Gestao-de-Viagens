# 🚀 SGPD: Ciclo de Vida e Fases do Projeto

Este documento descreve as fases de desenvolvimento do **SGPD (Sistema de Gestão de Passagens e Diárias)**, estabelecendo um mapa de progresso desde a infraestrutura base até a implementação de auditoria inteligente.

---

## 📋 Visão Geral do Projeto

O SGPD é uma solução governamental desenvolvida para a **SEFA/PA**, focada na automação e controle rigoroso de solicitações de viagens, cálculos de diárias conforme decretos legais e conformidade de prestação de contas.

### 🛡️ Metodologia AIOX
O projeto segue o framework **AIOX (Advanced Intelligent Orchestration)**, caracterizado por:
- **Desenvolvimento Baseado em Histórias (User Stories)**: Cada funcionalidade é isolada e validada de ponta a ponta.
- **Orquestração de Agentes**: Uso de especialistas dedicados (Dex/Dev, Quinn/QA, Orion/Master) para garantir qualidade técnica e de processos.
- **QA Gates**: Decisões de qualidade em cada entrega, garantindo que o código entre em produção apenas se cumprir os critérios de aceitação e segurança.

---

## 🏗️ Fase 1: Fundação e Governança
**Status: ✅ Concluída (100%)**

Foco na criação da "rocha" sobre a qual o sistema opera. Segurança e infraestrutura básica.

| Componente | Descrição | Status |
| :--- | :--- | :--- |
| **Infraestrutura Supabase** | Configuração de Tabelas Core (profiles, travel_requests, diem_rates). | ✅ |
| **Segurança RLS** | Row Level Security por departamento e hierarquia funcional. | ✅ |
| **Autenticação Corporativa** | Restrição de domínio `@sefa.pa.gov.br` e Integração SSO GestorGov. | ✅ |
| **Provisionamento JIT** | Criação automática de perfis no primeiro acesso via SSO. | ✅ |

> [!IMPORTANT]
> A Fase 1 estabeleceu que a segurança é nativa ao banco de dados, protegendo os dados mesmo fora da aplicação React.

---

## 🔄 Fase 2: Núcleo Operacional e UX Premium
**Status: ✅ Concluída (100%)**

Foco na digitalização do fluxo de viagem e criação de uma interface de alta fidelidade.

- **Wizard de Solicitação**: Formulário multi-etapas com cálculos automáticos baseados no destino e cargo.
- **Hierarquia de Aprovação**: Workflow real (Chefia -> Subsecretário -> DAD).
- **Gestão de Documentos**: Integração com Supabase Storage, upload de bilhetes e visualização via Signed URLs.
- **Interface Glassmorphism**: Design sofisticado com transparências, transições suaves e responsividade total.
- **Notificações**: Sistema de Toasts e alertas corporativos.

---

## 📊 Fase 3: Administração e Gestão de Auditoria
**Status: 🚀 Em Andamento**

Transição para o controle administrativo e relatórios gerenciais.

- **Gestão de Diárias**: Interface administrativa para atualização dinâmica de valores (Decreto 4025/2024).
- **Relatórios Consolidados**: Exportação para o Financeiro e visão analítica de gastos por fonte de recurso.
- **Aperfeiçoamento de Fluxos**: Refinamento de UX nas telas de prestação de contas.
- **Auditoria Administrativa**: Painel da DAD para revisão de recibos e declarações.

---

## 🧠 Fase 4: Inteligência e Auditoria Avançada
**Status: 📅 Planejada**

Implementação de camadas de inteligência para detecção de anomalias.

1. **Alertas de Erro/Fraude**: Notificações automáticas se os gastos excederem a tabela legal ou se houver duplicidade.
2. **Validação de Prazos Estrita**: Bloqueio total de solicitações para servidores com pendências > 5 dias.
3. **Auditoria por IA**: Análise semântica de justificativas de viagem para garantir alinhamento com interesses públicos.
4. **Dashboard de Transparência**: Exportação de dados para auditores externos e controle social.

---

> [!TIP]
> O status de cada fase pode ser acompanhado detalhadamente nos arquivos de histórias (`docs/stories/`) e no `progress-revision.md`.

— *Orion, Master Orchestrator* 🎯
