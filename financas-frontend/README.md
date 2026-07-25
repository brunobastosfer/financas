# financas-frontend

Frontend React/Next.js estático com shadcn/Radix, Tailwind, Lucide e Poppins.

## Desenvolvimento

```bash
copy .env.example .env.local
npm ci
npm run dev
```

`NEXT_PUBLIC_API_URL` deve apontar para a API incluindo o prefixo `/api`. Para imagens Kubernetes, use `/api` e deixe o Ingress rotear pelo mesmo host.

Comandos de validação:

```bash
npm run typecheck
npm test
npm run build
```
