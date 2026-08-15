import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    strictPort: true,
    // Vite blocks any Host header outside localhost/127.0.0.1 by default
    // (DNS-rebinding protection). "ibflora.local" now resolves to 127.0.0.1
    // in the Windows hosts file, so it needs to be explicitly allow-listed
    // or every request -- including the /api proxy calls -- gets a 403.
    allowedHosts: ['ibflora.local', 'localhost'],
    proxy: {
      '/api': {
        // Frappe is a multi-tenant server keyed off the Host header, so we
        // target the loopback address (no /etc/hosts entry required) and
        // force the Host header it expects for the ibflora.local site.
        target: 'http://127.0.0.1:8002',
        changeOrigin: false,
        headers: {
          Host: 'ibflora.local',
        },
        // Frappe's session cookie is scoped to "ibflora.local"; rewrite it
        // to the dev server's own host so the browser will actually store it.
        cookieDomainRewrite: 'localhost',
      },
      // Website Item images (website_image) are served from Frappe's public
      // files folder at this path -- needs the same proxying as /api.
      '/files': {
        target: 'http://127.0.0.1:8002',
        changeOrigin: false,
        headers: {
          Host: 'ibflora.local',
        },
      },
    },
  },
})
