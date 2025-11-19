# PtPro - Personal Trainer Management App

App di gestione per personal trainer con funzionalità complete per clienti, schede, alimentazione e allenamento.

## 🚀 Quick Start

1. **Installa le dipendenze**:
   ```bash
   npm install
   ```

2. **Configura Firebase**:
   - Copia `.env.example` in `.env`
   - Inserisci le tue credenziali Firebase

3. **Configura Cloudflare R2 (Storage foto/video)**:
   - Segui le istruzioni in `.env.example`
   - Configura le variabili `VITE_R2_*` nel file `.env`

4. **Avvia il server di sviluppo**:
   ```bash
   npm run dev
   ```

## 📦 Storage System

L'app usa **Cloudflare R2** per lo storage di foto e video:

- ✅ **99% più economico** rispetto a Firebase Storage
- ✅ Bandwidth download **gratuito** (vs €0.12/GB Firebase)
- ✅ Compressione automatica immagini (riduce 70-80%)
- ✅ 10GB storage gratis al mese

**Setup**: Vedi istruzioni in `.env.example`

## 🛠️ Scripts Disponibili

- `npm run dev` - Avvia development server
- `npm run build` - Build per produzione
- `npm run preview` - Preview build di produzione
- `npm run lint` - Esegui ESLint

## 📚 Documentazione

- [Gestione Admin](./ADMIN-MANAGEMENT.md) - Gestione amministratori
- [Alimentazione & Allenamento](./ALIMENTAZIONE-ALLENAMENTO-DOCS.md) - Funzionalità nutrizionali
- [Ottimizzazioni Mobile](./MOBILE_OPTIMIZATION_GUIDE.md) - Guide performance mobile

## 🔧 Tech Stack

- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Auth, Firestore)
- **Storage**: Cloudflare R2
- **Charts**: Chart.js, Recharts
- **Routing**: React Router v6

## 🔐 Sicurezza

- Non committare mai il file `.env` su git
- Ruota le credenziali R2 ogni 3-6 mesi
- Usa token con permessi minimi necessari

---

## React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh
