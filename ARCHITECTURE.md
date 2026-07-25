# Arquitetura

## Limites de deploy

O frontend e o backend são artefatos independentes. O frontend gera arquivos estáticos servidos por Nginx; o backend é uma API NestJS sem estado. O PostgreSQL é a única persistência obrigatória.

```text
Navegador
   │
   ├── / ───────► financas-frontend
   │
   └── /api ────► financas-backend ───► PostgreSQL
                              └────────► SMTP
```

## Backend

Cada domínio (`auth`, `family`, `finance`, `health`) é um módulo NestJS. O fluxo permitido é:

```text
Controller → Service → Repository abstrato → PrismaRepository → Prisma
```

- Controller: traduz HTTP em DTOs e respostas; não acessa banco.
- Service: concentra casos de uso, cálculos, validações e regras de visibilidade.
- Repository abstrato: define o contrato de persistência consumido pelo service.
- PrismaRepository: implementa somente leitura/escrita e mapeamento de tipos do banco.
- Policies/guards: autorização e escopo da família, sem duplicar persistência.

Novos domínios devem repetir esse recorte e registrar a implementação concreta com `useExisting` no módulo.

## Disponibilidade

Backend e frontend são stateless e suportam múltiplas réplicas. No Docker Compose, migrations são aplicadas no início do container. No Helm, um Job de hook executa `prisma migrate deploy` antes do rollout e as réplicas da API não disputam migrations.
