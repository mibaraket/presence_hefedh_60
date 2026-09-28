import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, Plugin } from 'vite';

function serveApkPlugin(): Plugin {
  const handler = (req: any, res: any, next: any) => {
    const rawUrl = req.url?.split('?')[0] || '';
    if (rawUrl === '/Hifz60-release.apk' || rawUrl === '/hifz60.apk') {
      const apkPath = path.resolve(__dirname, 'public/Hifz60-release.apk');
      if (fs.existsSync(apkPath)) {
        const stat = fs.statSync(apkPath);
        res.writeHead(200, {
          'Content-Type': 'application/vnd.android.package-archive',
          'Content-Disposition': 'attachment; filename="Hifz60-release.apk"',
          'Content-Length': stat.size,
          'Cache-Control': 'public, max-age=3600',
        });
        fs.createReadStream(apkPath).pipe(res);
        return;
      }
    }
    next();
  };

  return {
    name: 'serve-apk-plugin',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), serveApkPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
