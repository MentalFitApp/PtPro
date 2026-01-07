# 🌌 Nebula 2.0 - Roadmap Upgrade UI

## Panoramica

Questo documento descrive la roadmap per aggiornare tutte le pagine dell'app con lo stile **Nebula 2.0**, un design system moderno con effetti glass morphism, trasparenze e animazioni fluide.

---

## ✅ COMPLETATO

### 1. Design System Base

#### 1.1 NebulaBackground (`src/components/ui/NebulaBackground.jsx`)
- **5 preset animati**: Liquid Metal, Geometric Pulse, Flowing Ribbons, Particle Constellation, Aurora Borealis
- Canvas-based per performance ottimale
- Supporto scroll-aware (parallax su alcuni preset)

#### 1.2 Design Tokens
```javascript
// Trasparenze uniformi
const CARD_BG = 'bg-slate-800/40';           // Card principale
const CARD_BORDER = 'border-slate-700/30';   // Bordi sottili
const BLUR = 'backdrop-blur-sm';              // Blur leggero (non xl)
```

#### 1.3 CSS Mobile Optimization (`src/index.css`)
- Disabilitazione `backdrop-blur` su mobile touch per performance
- Override opacità per compensare blur mancante:
  ```css
  @media (hover: none) and (pointer: coarse) {
    .bg-slate-800/40 { background-color: rgba(30, 41, 59, 0.62) !important; }
    /* etc... */
  }
  ```

---

### 2. Componenti Layout

#### 2.1 NebulaSidebar (`src/components/layout/NebulaSidebar.jsx`)
- ✅ Sidebar desktop con glass morphism
- ✅ Collapsible (260px ↔ 72px)
- ✅ Sezioni raggruppate per colore (Dashboard, Gestione, Comunicazione, etc.)
- ✅ User dropdown con menu espandibile
- ✅ Light/Dark mode support
- ✅ Integrazione SidebarCustomizer

#### 2.2 MobileNebulaSidebar (dentro NebulaSidebar.jsx)
- ✅ Slide-out drawer per mobile
- ✅ User menu espandibile (click su avatar)
- ✅ Aiuto, Toggle Tema, Impostazioni, Personalizza Menu, Logout
- ✅ Light/Dark mode support

#### 2.3 NebulaBottomNav (`src/components/layout/NebulaBottomNav.jsx`)
- ✅ Bottom navigation per mobile
- ✅ Glass morphism background
- ✅ Icone animate con scale/glow
- ✅ Badge per notifiche
- ✅ Light/Dark mode support

#### 2.4 ProLayout (`src/components/layout/ProLayout.jsx`)
- ✅ Integrazione NebulaSidebar
- ✅ Integrazione NebulaBottomNav
- ✅ NebulaBackground come sfondo globale
- ✅ Margin-left dinamico per sidebar

---

### 3. Dashboard Admin

#### 3.1 DashboardDemo (`src/pages/admin/DashboardDemo.jsx`)
- ✅ **GlowCard** - Card con glass morphism e glow hover
  ```jsx
  className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/30 rounded-2xl"
  ```
- ✅ **HeroCard** - Riepilogo revenue con toggle Incassi/Rinnovi
- ✅ **StatCard** - Statistiche con icone colorate
- ✅ **QuickActions** - Azioni rapide personalizzabili
- ✅ **TabsContent** - Clienti, Scadenze, Chiamate, Check, Chat, Anamnesi
- ✅ **AlertPills** - Avvisi inline per scadenze e messaggi
- ✅ **SearchInput** - Ricerca con glass background
- ✅ Dati reali da Firebase

---

## 🔄 DA FARE - Lista Completa Pagine (da App.jsx routes)

### 📊 Riepilogo Totale

| Ruolo | Pagine | Completate | % |
|-------|--------|------------|---|
| **Pubbliche** | 9 | 0 | 0% |
| **Admin** | 41 | 6 | 15% |
| **Coach** | 14 | 0 | 0% |
| **Cliente** | 16 | 0 | 0% |
| **Collaboratore** | 3 | 0 | 0% |
| **CEO Platform** | 2 | 0 | 0% |
| **TOTALE** | **~85** | **6** | **~7%** |

> ⚠️ Nota: Alcune pagine sono condivise tra ruoli (Chat, Profile, etc.)
> 
> 📅 **Ultimo aggiornamento**: 7 Gennaio 2026

---

### 🔓 Pagine Pubbliche (9)

| # | Pagina | Route | Stato |
|---|--------|-------|-------|
| 1 | `LandingPage.jsx` | `/site` | ⬜ |
| 2 | `PublicLandingPage.jsx` | `/site/:tenantSlug/:slug` | ⬜ |
| 3 | `Login.jsx` | `/login` | ⬜ |
| 4 | `SetupAccount.jsx` | `/setup/:token` | ⬜ |
| 5 | `PlatformLogin.jsx` | `/platform-login` | ⬜ |
| 6 | `ForgotPassword.jsx` | `/client/forgot-password` | ⬜ |
| 7 | `AcceptInvite.jsx` | `/invite/:token` | ⬜ |
| 8 | `PrivacyPolicy.jsx` | `/privacy` | ⬜ |
| 9 | `TermsOfService.jsx` | `/terms` | ⬜ |

---

### 🔴 Pagine Admin (41)

| # | Pagina | Route | Stato |
|---|--------|-------|-------|
| 1 | `DashboardDemo.jsx` | `/` | ✅ |
| 2 | `AdminDashboard.jsx` | `/dashboard-legacy` | ⬜ |
| 3 | `Clients.jsx` | `/clients` | ✅ |
| 4 | `NewClient.jsx` | `/new-client` | ✅ |
| 5 | `ClientDetail.jsx` | `/client/:clientId` | ✅ |
| 6 | `EditClient.jsx` | `/edit/:id` | ✅ |
| 7 | `Updates.jsx` | `/updates` | ⬜ |
| 8 | `AdminChecksList.jsx` | `/admin/checks` | ⬜ |
| 9 | `AdminRatesList.jsx` | `/admin/rates` | ⬜ |
| 10 | `AdminAnamnesiList.jsx` | `/admin/anamnesi` | ⬜ |
| 11 | `Chat.jsx` | `/chat` | ⬜ |
| 12 | `AdminAnamnesi.jsx` | `/client/:id/anamnesi` | ⬜ |
| 13 | `Collaboratori.jsx` | `/collaboratori` | ✅ |
| 14 | `CollaboratoreDetail.jsx` | `/collaboratore-detail` | ⬜ |
| 15 | `CalendarPage.jsx` | `/calendar` | ⬜ |
| 16 | `ClientCallsCalendar.jsx` | `/calls-calendar` | ⬜ |
| 17 | `CalendarReport.jsx` | `/calendar-report/:date` | ⬜ |
| 18 | `BusinessHistory.jsx` | `/business-history` | ⬜ |
| 19 | `Dipendenti.jsx` | `/admin/dipendenti` | ⬜ |
| 20 | `TenantBranding.jsx` | `/admin/branding` | ⬜ |
| 21 | `ThemePreview.jsx` | `/admin/theme-preview` | ⬜ |
| 22 | `StatisticheDashboard.jsx` | `/statistiche` | ⬜ |
| 23 | `Statistiche.jsx` | `/statistiche/legacy` | ⬜ |
| 24 | `Profile.jsx` | `/profile` | ⬜ |
| 25 | `Settings.jsx` | `/settings` | ⬜ |
| 26 | `Analytics.jsx` | `/analytics` | ⬜ |
| 27 | `CoachAnalytics.jsx` | `/coach-analytics` | ⬜ |
| 28 | `Notifications.jsx` | `/notifications` | ⬜ |
| 29 | `AlimentazioneAllenamento.jsx` | `/alimentazione-allenamento` | ⬜ |
| 30 | `SchedaAlimentazione.jsx` | `/scheda-alimentazione/:clientId` | ⬜ |
| 31 | `SchedaAllenamento.jsx` | `/scheda-allenamento/:clientId` | ⬜ |
| 32 | `CourseAdmin.jsx` | `/courses` | ⬜ |
| 33 | `CourseDetail.jsx` | `/courses/:courseId` | ⬜ |
| 34 | `LessonPlayer.jsx` | `/courses/.../lessons/:lessonId` | ⬜ |
| 35 | `Community.jsx` | `/community` | ⬜ |
| 36 | `InstagramHub.jsx` | `/instagram` | ⬜ |
| 37 | `IntegrationsHub.jsx` | `/integrations` | ⬜ |
| 38 | `OAuthCallback.jsx` | `/oauth/callback` | ⬜ |
| 39 | `LandingPagesList.jsx` | `/admin/landing-pages` | ⬜ |
| 40 | `LandingPagesLeads.jsx` | `/admin/landing-pages/leads` | ⬜ |
| 41 | `LandingPageEditor.jsx` | `/admin/landing-pages/new` | ⬜ |
| 42 | `PlatformSettings.jsx` | `/platform-settings` | ⬜ |
| 43 | `CourseContentManager.jsx` | `/admin/course/:courseId/manage` | ⬜ |

---

### 🟢 Pagine Coach (14)

| # | Pagina | Route | Stato |
|---|--------|-------|-------|
| 1 | `CoachDashboard.jsx` | `/coach` | ⬜ |
| 2 | `Clients.jsx` (role=coach) | `/coach/clients` | ⬜ |
| 3 | `ClientDetail.jsx` (role=coach) | `/coach/client/:clientId` | ⬜ |
| 4 | `AdminAnamnesi.jsx` | `/coach/client/:id/anamnesi` | ⬜ |
| 5 | `CoachAnamnesiList.jsx` | `/coach/anamnesi` | ⬜ |
| 6 | `CoachChecksList.jsx` | `/coach/checks` | ⬜ |
| 7 | `CoachUpdates.jsx` | `/coach/updates` | ⬜ |
| 8 | `CoachAnalytics.jsx` | `/coach/analytics` | ⬜ |
| 9 | `Chat.jsx` | `/coach/chat` | ⬜ |
| 10 | `Profile.jsx` | `/coach/profile` | ⬜ |
| 11 | `ClientChecks.jsx` | `/coach/client/:clientId/checks` | ⬜ |
| 12 | `AlimentazioneAllenamento.jsx` | `/coach/schede` | ⬜ |
| 13 | `SchedaAlimentazione.jsx` | `/coach/scheda-alimentazione/:clientId` | ⬜ |
| 14 | `SchedaAllenamento.jsx` | `/coach/scheda-allenamento/:clientId` | ⬜ |

---

### 🔵 Pagine Cliente (16)

| # | Pagina | Route | Stato |
|---|--------|-------|-------|
| 1 | `OnboardingFlow.jsx` | `/client/onboarding` | ⬜ |
| 2 | `FirstAccess.jsx` | `/client/first-access` | ⬜ |
| 3 | `ClientDashboard.jsx` | `/client/dashboard` | ⬜ |
| 4 | `ClientAnamnesi.jsx` | `/client/anamnesi` | ⬜ |
| 5 | `ClientChecks.jsx` | `/client/checks` | ⬜ |
| 6 | `ClientPayments.jsx` | `/client/payments` | ⬜ |
| 7 | `Chat.jsx` | `/client/chat` | ⬜ |
| 8 | `Profile.jsx` | `/client/profile` | ⬜ |
| 9 | `ClientSchedaAlimentazione.jsx` | `/client/scheda-alimentazione` | ⬜ |
| 10 | `ClientSchedaAllenamento.jsx` | `/client/scheda-allenamento` | ⬜ |
| 11 | `CourseDashboard.jsx` | `/client/courses` | ⬜ |
| 12 | `CourseDetail.jsx` | `/client/courses/:courseId` | ⬜ |
| 13 | `LessonPlayer.jsx` | `/client/courses/.../lessons/:lessonId` | ⬜ |
| 14 | `Community.jsx` | `/client/community` | ⬜ |
| 15 | `ClientSettings.jsx` | `/client/settings` | ⬜ |
| 16 | `ClientHabits.jsx` | `/client/habits` | ⬜ |

---

### 🟡 Pagine Collaboratore (3)

| # | Pagina | Route | Stato |
|---|--------|-------|-------|
| 1 | `FirstAccess.jsx` | `/collaboratore/first-access` | ⬜ |
| 2 | `CollaboratoreDashboard.jsx` | `/collaboratore/dashboard` | ⬜ |
| 3 | `CalendarPage.jsx` | `/collaboratore/calendar` | ⬜ |

---

### 🟣 Pagine CEO Platform (2)

| # | Pagina | Route | Stato |
|---|--------|-------|-------|
| 1 | `CEOPlatformDashboard.jsx` | `/platform-dashboard` | ⬜ |
| 2 | `TenantDeepDive.jsx` | `/platform/tenant/:tenantId` | ⬜ |

---

### 🔁 Componenti Condivisi (riusati tra ruoli)

Questi componenti appaiono in più ruoli, quindi vanno aggiornati una volta:

| Componente | Usato in |
|------------|----------|
| `Chat.jsx` | Admin, Coach, Client |
| `Profile.jsx` | Admin, Coach, Client |
| `CalendarPage.jsx` | Admin, Collaboratore |
| `CourseDetail.jsx` | Admin, Client |
| `LessonPlayer.jsx` | Admin, Client |
| `Community.jsx` | Admin, Client |
| `FirstAccess.jsx` | Client, Collaboratore |
| `ClientDetail.jsx` | Admin, Coach |
| `AdminAnamnesi.jsx` | Admin, Coach |
| `AlimentazioneAllenamento.jsx` | Admin, Coach |
| `SchedaAlimentazione.jsx` | Admin, Coach |
| `SchedaAllenamento.jsx` | Admin, Coach |
| `CoachAnalytics.jsx` | Admin, Coach |

---

## 📋 Guida Implementazione

### Step per ogni pagina:

#### 1. Rimuovere sfondo statico
```diff
- <div className="min-h-screen bg-slate-900">
+ <div className="min-h-screen">
```
Il NebulaBackground è già in ProLayout.

#### 2. Convertire card a GlowCard style
```jsx
// PRIMA
<div className="bg-slate-800 rounded-lg p-4">

// DOPO
<div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/30 rounded-2xl p-5">
```

#### 3. Applicare Design Tokens
```jsx
// Card container
className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/30 rounded-2xl"

// Input fields
className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/30 rounded-xl px-4 py-3 text-white placeholder-slate-500"

// Buttons primary
className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl px-5 py-2.5 font-medium"

// Buttons secondary
className="bg-white/10 hover:bg-white/15 text-white border border-white/10 rounded-xl px-5 py-2.5"

// Hover states
className="hover:bg-slate-800/40 transition-colors"
```

#### 4. Aggiungere animazioni Framer Motion
```jsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  whileHover={{ y: -2, scale: 1.01 }}
  className="..."
>
```

#### 5. Icone con glow
```jsx
<div className="p-2 rounded-xl bg-blue-500/10 shadow-lg shadow-blue-500/20">
  <Icon size={18} className="text-blue-400" />
</div>
```

---

## 🎨 Palette Colori Nebula

### Backgrounds
| Token | Classe | Uso |
|-------|--------|-----|
| Card | `bg-slate-800/40` | Container principali |
| Card Hover | `bg-slate-800/50` | Hover state |
| Input | `bg-slate-800/40` | Form fields |
| Modal | `bg-slate-900/95` | Overlay modals |
| Tab Active | `bg-blue-500/10` | Tab selezionato |

### Borders
| Token | Classe | Uso |
|-------|--------|-----|
| Subtle | `border-slate-700/30` | Card, inputs |
| Glow | `border-cyan-500/30` | Focus, active |

### Text
| Token | Classe | Uso |
|-------|--------|-----|
| Primary | `text-white` | Titoli |
| Secondary | `text-slate-300` | Body text |
| Muted | `text-slate-400` | Labels |
| Disabled | `text-slate-500` | Placeholder |

### Accent Colors (per icone/badges)
| Colore | Background | Text | Uso |
|--------|------------|------|-----|
| Blue | `bg-blue-500/10` | `text-blue-400` | Clienti, Info |
| Cyan | `bg-cyan-500/10` | `text-cyan-400` | Chiamate, Comunicazione |
| Emerald | `bg-emerald-500/10` | `text-emerald-400` | Pagamenti, Successo |
| Amber | `bg-amber-500/10` | `text-amber-400` | Warning, Scadenze |
| Rose | `bg-rose-500/10` | `text-rose-400` | Errori, Danger |
| Purple | `bg-purple-500/10` | `text-purple-400` | Chat, Analytics |

---

## 📱 Responsive Guidelines

### Mobile First
```jsx
className="p-4 sm:p-5 lg:p-6"
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
className="text-sm sm:text-base"
```

### Bottom Padding per BottomNav
```jsx
// Su mobile, aggiungere padding bottom per la bottom nav
className="pb-24 lg:pb-6"
```

### Sidebar Margin
```jsx
// ProLayout già gestisce ml-[72px] lg:ml-[260px]
// Le pagine non devono preoccuparsene
```

---

## ⚡ Performance Notes

1. **Blur su Mobile**: Disabilitato via CSS media query per performance
2. **Animazioni**: Usare `will-change` con parsimonia
3. **Canvas**: NebulaBackground usa requestAnimationFrame ottimizzato
4. **Images**: Usare lazy loading per immagini pesanti

---

## 🔧 Componenti Riutilizzabili da Creare

### Da estrarre da DashboardDemo:
- [ ] `<GlowCard>` - Card con glass morphism
- [ ] `<StatCard>` - Statistiche con icona
- [ ] `<SearchInput>` - Input ricerca styled
- [ ] `<AlertPill>` - Badge alert inline
- [ ] `<TabsContainer>` - Tabs con stile Nebula
- [ ] `<SectionHeader>` - Header sezione con title + action

### Nuovi componenti:
- [ ] `<NebulaModal>` - Modal con glass background
- [ ] `<NebulaTable>` - Tabella con stile Nebula
- [ ] `<NebulaSelect>` - Dropdown styled
- [ ] `<NebulaDatePicker>` - Date picker styled

---

## 📅 Timeline Suggerita (Aggiornata)

### Fase 1: Admin Core (Settimane 1-3)
| Settimana | Focus | Pagine |
|-----------|-------|--------|
| 1 | Componenti + Client List | Estrarre GlowCard, Clients.jsx |
| 2 | Client Management | ClientDetail, NewClient, EditClient |
| 3 | Comunicazione | Chat, Notifications, Updates |

### Fase 2: Admin Tools (Settimane 4-6)
| Settimana | Focus | Pagine |
|-----------|-------|--------|
| 4 | Calendario & Report | CalendarPage, CalendarReport, BusinessHistory |
| 5 | Statistiche | StatisticheDashboard, Analytics, CoachAnalytics |
| 6 | Schede | SchedaAllenamento, SchedaAlimentazione, AlimentazioneAllenamento |

### Fase 3: Admin Extra (Settimane 7-8)
| Settimana | Focus | Pagine |
|-----------|-------|--------|
| 7 | Gestione | Collaboratori, Dipendenti, AdminChecks/Rates/Anamnesi |
| 8 | Integrazioni | InstagramHub, IntegrationsHub, LandingPages |

### Fase 4: Altri Ruoli (Settimane 9-12)
| Settimana | Focus | Pagine |
|-----------|-------|--------|
| 9 | Coach | CoachDashboard + tutte pagine coach |
| 10 | Client Part 1 | ClientDashboard, Onboarding, FirstAccess |
| 11 | Client Part 2 | ClientSchede, ClientChecks, ClientPayments, Settings |
| 12 | Collaboratore + CEO | CollaboratoreDashboard, CEOPlatformDashboard |

### Fase 5: Pubbliche + Polish (Settimane 13-14)
| Settimana | Focus | Pagine |
|-----------|-------|--------|
| 13 | Pubbliche | Login, LandingPage, AcceptInvite, Setup |
| 14 | Polish | Bug fix, animazioni, testing finale |

---

## ✨ Checklist per PR

Per ogni pagina convertita:
- [ ] Rimosso background statico
- [ ] Card convertite a glass morphism
- [ ] Design tokens applicati
- [ ] Animazioni Framer Motion aggiunte
- [ ] Responsive testato (mobile/tablet/desktop)
- [ ] Light mode supportato (se applicabile)
- [ ] Performance testata su mobile
- [ ] No regressioni funzionali
