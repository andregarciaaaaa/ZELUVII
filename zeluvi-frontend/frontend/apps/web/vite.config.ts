import { defineConfig } from 'vite'; import react from '@vitejs/plugin-react';
/** Em desenvolvimento, as chamadas a /api vão para o back-end (porta 3333); assim não há problema de CORS. */
export default defineConfig({ plugins:[react()], server:{ proxy:{ '/api':'http://localhost:3333' } } });
