import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages serves project sites from /<repo-name>/. The deploy workflow
// sets VITE_BASE accordingly; local dev and user/org pages use '/'.
const base = process.env.VITE_BASE ?? '/'
const basepath = base.replace(/\/+$/, '') || '/'

const config = defineConfig({
  base,
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    tailwindcss(),
    tanstackStart({
      // Fully static SPA build — no server needed, deployable to GitHub Pages.
      // outputPath '/index' writes the SPA shell as index.html.
      spa: { enabled: true, prerender: { outputPath: '/index' } },
      router: { basepath },
    }),
    viteReact(),
  ],
})

export default config
