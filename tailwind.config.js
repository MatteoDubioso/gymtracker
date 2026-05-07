import daisyui from "daisyui"

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  // Inseriamo daisyUI tra i plugin
  plugins: [daisyui],
  
  // Configuriamo i temi di daisyUI
  daisyui: {
    themes: [
      "light",       // Il tema chiaro di base
      "dark",        // Il tema scuro di base
      "dracula",     // Tema famosissimo: sfondi scuri, accenti viola/rosa
      "cyberpunk",   // Giallo acceso, nero e font aggressivi
      "dim",         // Un grigio scuro molto elegante (perfetto per app serie)
      "sunset",      // Colori scuri caldi con accenti arancioni
    ],
  },
}