import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { imagetools } from 'vite-imagetools'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config()

function netlifyFunctionsDev(): Plugin {
  return {
    name: 'netlify-functions-dev',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/.netlify/functions/')) {
          return next()
        }

        const urlObj = new URL(req.url, 'http://localhost:5173')
        const functionName = urlObj.pathname.replace('/.netlify/functions/', '').split('/')[0]
        const functionPath = path.resolve(process.cwd(), `netlify/functions/${functionName}.ts`)

        try {
          const chunks: any[] = []
          for await (const chunk of req) {
            chunks.push(chunk)
          }
          const rawBody = Buffer.concat(chunks).toString('utf8')

          const mod = await server.ssrLoadModule(functionPath)

          if (typeof mod.default === 'function') {
            const webReq = new Request(urlObj.href, {
              method: req.method,
              headers: req.headers as any,
              body: req.method !== 'GET' && req.method !== 'HEAD' && rawBody ? rawBody : undefined,
            })
            const webRes: Response = await mod.default(webReq, {})
            res.statusCode = webRes.status
            webRes.headers.forEach((val, key) => {
              res.setHeader(key, val)
            })
            const resBody = await webRes.text()
            return res.end(resBody)
          }

          if (typeof mod.handler === 'function') {
            const queryParams: Record<string, string> = {}
            urlObj.searchParams.forEach((v, k) => {
              queryParams[k] = v
            })

            const event = {
              httpMethod: req.method,
              path: urlObj.pathname,
              queryStringParameters: queryParams,
              headers: req.headers,
              body: rawBody,
            }

            const result = await mod.handler(event, {})
            res.statusCode = result.statusCode || 200
            if (result.headers) {
              for (const [key, val] of Object.entries(result.headers)) {
                res.setHeader(key, val as string)
              }
            }
            return res.end(result.body || '')
          }

          res.statusCode = 500
          res.end(JSON.stringify({ error: `Function ${functionName} has no exported handler` }))
        } catch (err: any) {
          console.error(`[netlify-functions-dev] Error running ${functionName}:`, err)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: err.message || 'Internal Function Error' }))
        }
      })
    }
  }
}

export default defineConfig({
  plugins: [
    react(),
    imagetools(),
    netlifyFunctionsDev(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    watch: {
      ignored: ['**/.netlify/**'],
    },
  },
})
