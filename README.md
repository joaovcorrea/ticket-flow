# TicketFlow

Plataforma de tickets interna inspirada no **Freshservice**, com integração WhatsApp, departamentos, agentes, SLA, gamificação por pontos e dashboards com relatórios.

## Funcionalidades

| Módulo | Descrição |
|--------|-----------|
| **Tickets** | Criação manual ou automática via WhatsApp, status, prioridade, atribuição |
| **Departamentos** | TI, Financeiro, Comercial — filas independentes |
| **Agentes** | Roles (Admin, Supervisor, Agente) + ranking de pontos |
| **SLA** | Prazos de 1ª resposta e resolução por prioridade |
| **Pontos** | +10 resolver, +5 SLA ok, +3 1ª resposta, +8 satisfação |
| **Dashboard** | KPIs, tickets recentes, ranking, visão por departamento |
| **Relatórios** | Resolvidos por agente/dept, volume diário, canais, prioridades |
| **WhatsApp** | Webhook para Meta Cloud API e Evolution API |

## Stack

- **Next.js 15** (App Router)
- **Prisma** + SQLite (dev) — troque para PostgreSQL em produção
- **Tailwind CSS 4**
- **Recharts** (gráficos)
- **TypeScript**

## Início rápido

```bash
cd Projects/ticketflow
npm install
npm run db:push
npm run db:seed
npm run dev
```

Acesse: **http://localhost:3000**

### Dados de demonstração

- **Admin:** admin@ticketflow.local / `123456`
- 3 departamentos, 4 agentes, 5 tickets de exemplo

## Integração WhatsApp

### Meta Cloud API (oficial)

1. Crie um app em [developers.facebook.com](https://developers.facebook.com)
2. Configure o WhatsApp Business API
3. Preencha no `.env`:
   ```
   WHATSAPP_VERIFY_TOKEN=seu-token
   WHATSAPP_ACCESS_TOKEN=seu-token
   WHATSAPP_PHONE_NUMBER_ID=seu-id
   ```
4. Configure o webhook: `https://seu-dominio.com/api/webhooks/whatsapp`

### Evolution API (self-hosted)

O webhook também aceita o formato Evolution API (`messages.upsert`).

### Fluxo automático

1. Cliente envia mensagem no WhatsApp
2. Webhook cria ticket (ou adiciona à conversa existente)
3. Agente responde pelo painel → mensagem enviada ao WhatsApp
4. Ao resolver, agente ganha pontos automaticamente

## Estrutura do projeto

```
src/
├── app/
│   ├── page.tsx              # Dashboard
│   ├── tickets/              # Lista, detalhe, novo
│   ├── departments/          # Departamentos
│   ├── agents/               # Agentes + ranking
│   ├── sla/                  # Políticas SLA
│   ├── reports/              # Relatórios
│   └── api/                  # REST API + webhook WhatsApp
├── components/
└── lib/
    ├── prisma.ts
    ├── sla.ts                # Lógica SLA + pontos
    ├── whatsapp.ts           # Integração WhatsApp
    └── analytics.ts          # Queries de dashboard/relatórios
```

## Próximos passos sugeridos

- [ ] Autenticação (NextAuth) com login de agentes
- [ ] Notificações em tempo real (WebSocket/Pusher)
- [ ] Kanban board para tickets
- [ ] CSAT (pesquisa de satisfação pós-resolução via WhatsApp)
- [ ] Migração para PostgreSQL em produção
- [ ] Automações (regras de roteamento por palavra-chave)
- [ ] Exportação de relatórios (PDF/CSV)

## Licença

MIT
