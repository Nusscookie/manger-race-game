import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Auch ältere Handys und Smartboard-Browser sollen das Spiel laden können.
    target: ['es2019', 'chrome80', 'safari13', 'firefox78', 'edge88'],
  },
  test: {
    environment: 'node',
  },
});
