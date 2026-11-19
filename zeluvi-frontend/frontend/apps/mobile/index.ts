import { registerRootComponent } from 'expo'; import * as Crypto from 'expo-crypto'; import App from './App';
// o cliente compartilhado usa crypto.randomUUID (Idempotency-Key); no RN vem do expo-crypto
(globalThis as any).crypto ??= { randomUUID: Crypto.randomUUID };
registerRootComponent(App);
