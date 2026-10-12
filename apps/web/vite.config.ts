import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// ローカル開発用: AWSに接続せず /api/hello のサンプル応答を返す
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'local-mock-api',
      configureServer(server) {
        server.middlewares.use('/api/hello', (_req, res) => {
          res.setHeader('content-type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ message: 'Hello World', sample: 'Hello from local mock' }));
        });
      },
    },
  ],
});
