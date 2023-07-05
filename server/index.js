import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createServer as createViteServer } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isTest = process.env.VITEST;

process.env.MY_CUSTOM_SECRET = 'API_KEY_qwertyuiop';

export async function createServer(
  root = process.cwd(),
  isProd = process.env.NODE_ENV === 'production',
  hmrPort,
) {
  const resolve = (p) => path.resolve(__dirname, p);

  const indexProd = isProd
    ? fs.readFileSync(resolve('../dist/client/index.html'), 'utf-8')
    : '';
  // console.log('html path', resolve(''));
  // console.log('indexProd', indexProd);

  const app = express();

  /**
   * @type {import('vite').ViteDevServer}
   */
  let vite;
  if (!isProd) {
    root = root + '/client';
    // console.log(root);
    vite = await createViteServer({
      root: root,
      logLevel: isTest ? 'error' : 'info',
      server: {
        middlewareMode: true,
        // watch: {
        //   // During tests we edit the files too fast and sometimes chokidar
        //   // misses change events, so enforce polling for consistency
        //   usePolling: true,
        //   interval: 100,
        // },
        // hmr: {
        //   // port: hmrPort,
        // },
      },
      appType: 'custom',
    });
    // use vite's connect instance as middleware
    app.use(vite.middlewares);
  } else {
    app.use((await import('compression')).default());
    app.use(
      (await import('serve-static')).default(resolve('../dist/client'), {
        index: false,
      }),
    );
  }

  app.use('*', async (req, res) => {
    const url = req.originalUrl;
    console.log('url', url);
    try {
      let template, render;
      if (!isProd) {
        // always read fresh template in dev
        template = fs.readFileSync(resolve('../client/index.html'), 'utf-8');
        // console.log('1', template);
        template = await vite.transformIndexHtml(url, template);
        // console.log('2', template);
        render = (
          await vite.ssrLoadModule(
            path.resolve(__dirname, '../client/src/entry-server.jsx'),
          )
        ).render;
      } else {
        template = indexProd;
        render = (await import('../dist/server/entry-server.cjs')).render;
      }

      const context = {};
      const appHtml = render(url, context);

      // console.log('appHtml', appHtml);
      // console.log('context', context);

      if (context.url) {
        // Somewhere a `<Redirect>` was rendered
        return res.redirect(301, context.url);
      }

      const html = template.replace(`<!--app-html-->`, appHtml);
      // console.log('url', url);

      res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    } catch (e) {
      !isProd && vite.ssrFixStacktrace(e);
      console.log(e.stack);
      res.status(500).end(e.stack);
    }
  });

  return { app, vite };
}

if (!isTest) {
  createServer().then(({ app }) =>
    app.listen(5173, () => {
      console.log('http://localhost:5173');
    }),
  );
}
