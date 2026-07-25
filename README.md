# Nós Dois — finanças familiares

Monorepositório operacional com projetos independentes para facilitar pipelines e deploys separados:

- [`financas-frontend`](./financas-frontend): React, Next.js, shadcn/Radix, Tailwind, Lucide e fonte Poppins.
- [`financas-backend`](./financas-backend): NestJS, Prisma e PostgreSQL.
- [`helm/financas`](./helm/financas): chart Kubernetes para frontend, backend e PostgreSQL opcional.

## Executar toda a plataforma com Docker

Requisitos: Docker Engine 24+ com Docker Compose v2.

```bash
cp .env.example .env
docker compose up --build --wait
```

Serviços:

| Serviço | Endereço |
| --- | --- |
| Aplicação | http://localhost:3000 |
| API | http://localhost:3333/api |
| Health check | http://localhost:3333/api/health |
| Mailpit | http://localhost:8025 |
| PostgreSQL | localhost:5434 |

O seed idempotente cria os usuários de demonstração:

- `helena@nosdois.app` / `familia123`
- `gabriel@nosdois.app` / `familia123`

Em produção, mantenha `RUN_DATABASE_SEED=false`, use secrets fortes e não publique as portas do PostgreSQL ou do SMTP.

## Executar os projetos isoladamente

Cada pasta tem seu próprio `package.json`, lockfile, `.env.example`, Dockerfile e documentação:

```bash
cd financas-backend
npm ci
npm run prisma:generate
npm run start:dev
```

```bash
cd financas-frontend
npm ci
npm run dev
```

## Arquitetura

O backend separa responsabilidades por módulo e camada:

```text
modules/<dominio>/
├── controllers/   # contrato HTTP
├── dto/           # validação de entrada
├── services/      # regras de negócio
├── repositories/  # contrato abstrato e implementação Prisma
├── policies/      # regras de autorização, quando aplicável
└── guards/        # autenticação/autorização, quando aplicável
```

Os services dependem das classes abstratas de repository. Os módulos injetam as implementações `Prisma*Repository`, permitindo testes e troca de persistência sem acoplar regra de negócio ao ORM.

Consulte também [`ARCHITECTURE.md`](./ARCHITECTURE.md) e [`SECURITY.md`](./SECURITY.md).

## Kubernetes com Helm

O chart usa um Secret externo por padrão. Crie-o antes do deploy:

```bash
kubectl create namespace financas
kubectl -n financas create secret generic financas-secrets \
  --from-literal=DATABASE_URL='postgresql://nos_dois:SENHA@release-financas-postgresql:5432/nos_dois?schema=public' \
  --from-literal=JWT_SECRET='CHAVE_ALEATORIA_COM_PELO_MENOS_32_CARACTERES' \
  --from-literal=POSTGRES_PASSWORD='SENHA'

helm upgrade --install release ./helm/financas \
  --namespace financas \
  --set backend.image.repository=registry/financas-backend \
  --set backend.image.tag=1.0.0 \
  --set frontend.image.repository=registry/financas-frontend \
  --set frontend.image.tag=1.0.0
```

Para produção, prefira PostgreSQL gerenciado com backup/PITR, defina `postgresql.enabled=false` e aponte `DATABASE_URL` para o serviço externo.
