@import "tailwindcss";

@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
}

@layer base {
  body {
    @apply bg-slate-50 text-slate-900 antialiased selection:bg-cyan-100;
  }
}

@media print {
  @page {
    margin: 1.5cm;
    size: A4;
  }
  
  html, body {
    background-color: white !important;
    print-color-adjust: exact !important;
    -webkit-print-color-adjust: exact !important;
  }

  * {
    print-color-adjust: exact !important;
    -webkit-print-color-adjust: exact !important;
  }
}

.glass-light {
  @apply bg-white/70 backdrop-blur-md border border-white shadow-sm;
}

.tech-card {
  @apply bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all duration-300;
}

.tech-card-hover {
  @apply hover:shadow-[0_20px_40px_rgba(6,182,212,0.08)] hover:border-cyan-100 hover:-translate-y-1;
}

.tech-gradient-text {
  @apply text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-indigo-900;
}

.tech-button {
  @apply bg-slate-900 text-white rounded-full font-bold transition-all duration-300 shadow-lg shadow-slate-200 hover:bg-indigo-950 hover:shadow-cyan-100 hover:scale-105 active:scale-95;
}
