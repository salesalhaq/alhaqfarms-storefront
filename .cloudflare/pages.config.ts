import { defineConfig } from '@opennextjs/cloudflare';

export default defineConfig({
  cloudflarePages: {
    buildCommand: 'npm run build',
    outputDirectory: '.open-next',
  },
});
