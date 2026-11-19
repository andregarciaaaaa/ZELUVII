# Zeluvi — Front-end
- `packages/shared`: tokens do guia de estilo, tipos do DER, cliente de API (erros nos 2 formatos, refresh, Idempotency-Key), validações, regras de reserva, menu por perfil.
- `apps/web`: React + Vite (login, recuperação, redefinição, início, reservas).
- `apps/mobile`: React Native + Expo (login, recuperação, reservas, barra inferior de 5 itens).

`npm install` na raiz; `npm run web` ou `npm run mobile`. URL da API: `VITE_API_URL` / `EXPO_PUBLIC_API_URL`.

## A confirmar com o grupo
1. Prefixo da API (`/api/v1` x `/v1`) e caminhos dos endpoints (`packages/shared/src/api.ts`).
2. Períodos de reserva: o banco aceita início 9h/12h/15h/18h (3 h); o protótipo mostra manhã/tarde/noite (8–13, 14–18, 18–23).
3. Reserva nasce `pendente` (RN06); o protótipo antigo confirmava direto.
