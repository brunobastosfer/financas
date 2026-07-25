# Segurança

## Configuração obrigatória

- Gere `JWT_SECRET` aleatório com no mínimo 32 caracteres.
- Armazene `DATABASE_URL`, senhas e chaves somente no cofre de secrets do ambiente.
- Restrinja `WEB_ORIGIN` aos hosts reais, separados por vírgula quando houver mais de um.
- Use TLS no Ingress e PostgreSQL com conexão criptografada em produção.
- Desative o seed (`RUN_DATABASE_SEED=false`) fora do ambiente de demonstração.

## Controles implementados

- DTOs com allowlist e rejeição de campos desconhecidos.
- JWT, escopo de família e política de visibilidade individual/conjunta/parcial.
- Rate limit global e limite reforçado no login.
- Helmet, CORS explícito, limite de payload e headers de segurança no Nginx.
- Containers web não-root, sem capabilities, filesystem somente leitura e `no-new-privileges`.
- Probes, limites de recursos, PDB, ServiceAccount sem token e NetworkPolicies no Helm.
- Convites armazenam somente o hash do token e têm expiração.

## Operação

Execute regularmente:

```bash
npm audit --omit=dev
docker scout cves local://financas-backend
docker scout cves local://financas-frontend
```

Rotacione secrets após qualquer suspeita de exposição. Não inclua valores reais em `.env.example`, `values.yaml`, logs, imagens ou histórico Git.
