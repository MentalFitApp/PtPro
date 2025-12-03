# 🎨 Landing Pages System

Sistema completo per la creazione di landing pages multi-tenant con editor avanzato e AI.

## ✨ Caratteristiche

### Editor Avanzato
- **Drag & Drop**: Riordina sezioni facilmente
- **Modifica Inline**: Modifica direttamente nell'editor
- **AI Assistant**: Genera intere pagine con un prompt
- **Live Preview**: Visualizza in tempo reale come appare
- **Properties Panel**: Pannello laterale per proprietà dettagliate

### Sezioni Disponibili

#### 1. **Hero Banner** 
Sezione principale con titolo, sottotitolo, CTA e background
- Azioni CTA: scroll, link, form, video upload
- Background: immagine o video
- Overlay personalizzabile

#### 2. **Video Upload** (max 1GB)
Form per caricamento video con validazione
- Campi opzionali: nome, email, telefono
- Storage: Cloudflare R2
- Redirect dopo upload
- Messaggio di successo personalizzato

#### 3. **Contact Form**
Form contatti con notifiche email
- Campi configurabili
- Email notifiche
- Redirect dopo invio
- Messaggio successo personalizzato

#### 4. **Features**
Griglia di caratteristiche/servizi
- Layout: grid o lista
- 2-4 colonne
- Icone emoji o immagini

#### 5. **Pricing**
Tabelle prezzi con piani
- Piano evidenziato
- Features per piano
- CTA personalizzato per piano

#### 6. **Testimonials**
Recensioni clienti
- Layout: carousel o grid
- Rating stelle
- Foto cliente

#### 7. **Call to Action**
Invito all'azione
- Stili: gradient, solid, outline
- Dimensioni: small, medium, large
- Azioni: scroll, link, form

#### 8. **FAQ**
Domande frequenti
- Accordion automatico
- Q&A personalizzabili

## 🚀 Utilizzo

### Creazione Pagina

1. **Vai a Landing Pages** nel menu
2. **Crea Nuova Pagina**:
   - Manuale: "Crea Pagina Vuota"
   - AI: "Genera con AI"

### Editor

**Top Toolbar**:
- Titolo pagina
- AI Assistant (genera sezioni con prompt)
- **Desktop/Mobile toggle** 📱💻 (anteprima responsive)
- Preview toggle (editor/anteprima)
- Salva

**Settings Bar**:
- Slug URL
- Stato (bozza/pubblicata/archiviata)
- Link "Visualizza Live" (se pubblicata)

**Canvas Area (9 cols)**:
- Sezioni impilate verticalmente
- Hover per controlli: edit, move, delete
- AI quick edit per sezione

**Sidebar (3 cols)**:
- Properties editor dinamico
- Cambia in base al tipo sezione
- Upload immagini inline

### AI Assistant - 3 Modalità

#### 1️⃣ **Descrizione (Prompt)**
Descrivi cosa vuoi e l'AI crea la struttura.

**Esempio**:
```
"Landing page per fitness con hero, features (velocità, sicurezza, supporto), 
prezzi (base €29, pro €79) e form contatto"
```

Genera automaticamente:
- Hero con CTA
- Features 3 colonne
- Pricing 2 piani
- Contact form
- CTA finale

**Quick Prompts** pre-impostati per casi comuni

#### 2️⃣ **Da URL Competitor** 🔗
Copia la struttura da una pagina esistente!

**Come funziona**:
1. Incolla URL del competitor (es: `https://competitor.com/landing`)
2. L'AI scarica e analizza la pagina
3. Estrae: struttura, sezioni, CTAs, layout
4. **🎯 Wizard Azioni Interattivo**:
   - L'AI identifica tutti i pulsanti/link
   - Ti chiede uno per uno: "Cosa fa questo pulsante?"
   - Tu configuri per ogni CTA:
     - **Link**: URL destinazione + nuova tab
     - **Form**: Campi da raccogliere + dove salvare + redirect
     - **Video**: Campi richiesti + collection + redirect
     - **Scroll**: ID sezione target
5. Ricrea l'INTERO FLUSSO con le azioni mappate
6. Genera contenuti ottimizzati

**Esempio pratico**:
```
URL: https://gymshark.com/products/landing

→ AI trova: "Buy Now", "Learn More", "Contact Us"

→ Wizard chiede:
   "Buy Now" → Tu: "Link a /checkout"
   "Learn More" → Tu: "Scroll a #features"  
   "Contact Us" → Tu: "Form con Nome+Email, salva in 'leads', redirect a /grazie"

→ Genera 3 sezioni con azioni già configurate!
```

**Perfetto per**:
- Copiare layout vincenti con TUTTE le funzionalità
- Clonare funnel completi
- Risparmiare ore di configurazione
- Mappare flussi complessi

**Nota**: Wizard già funzionante! Integrazione API in arrivo

#### 3️⃣ **Da Screenshot** 📸
Carica uno screenshot e l'AI ricrea il design!

**Come funziona**:
1. Carica screenshot della pagina (PNG/JPG, max 10MB)
2. AI Vision analizza:
   - Layout e struttura sezioni
   - Tipografia e gerarchie testi
   - Colori e stili visivi
   - Posizionamento CTAs
3. **🎯 Wizard Azioni Interattivo**:
   - Identifica visualmente i pulsanti
   - Ti guida nella configurazione di ogni azione
   - Supporta form, upload, redirect, scroll
4. Ricrea design + funzionalità complete
5. Adatta i contenuti al tuo brand

**Esempio pratico**:
```
Screenshot di landing Figma:

→ AI Vision vede 2 pulsanti: "Get Started" + "Watch Demo"

→ Wizard chiede:
   "Get Started" → Tu: "Form con Email+Nome, salva in 'signups', redirect a /onboarding"
   "Watch Demo" → Tu: "Upload video da 1GB, salva in 'demos'"

→ Genera design identico + form + upload funzionanti!
```

**Perfetto per**:
- Convertire design Figma/Sketch → codice funzionante
- Ricreare pagine offline con azioni
- Analizzare landing da mobile
- Clonare design + funzionalità complete

**Nota**: Wizard già funzionante! Vision API in arrivo

### Azioni CTA

**Scroll**: Scrolla a una sezione
```javascript
ctaAction: 'scroll'
ctaTarget: '#contact' // ID sezione
```

**Link**: Link esterno o altra landing page
```javascript
ctaAction: 'link'
ctaTarget: 'https://example.com' // o '/site/tenant/altra-pagina'
ctaTargetBlank: true // Apri in nuova tab
```

**Form**: Apre form contatto
```javascript
ctaAction: 'form'
ctaTarget: 'contact-form-id'
```

**Video**: Apre dialog upload video
```javascript
ctaAction: 'video'
// Mostra form upload con limite 1GB
```

### Video Upload

**Configurazione**:
- Max size: 1024 MB (default)
- Formati: mp4, mov, avi
- Require: nome, email, telefono (opzionali)
- Redirect: URL redirect dopo upload
- Storage: Cloudflare R2 path `clients/{userId}/landing-videos/`

**Validazione Client-Side**:
- Controllo dimensione file
- Controllo formato
- Progress bar upload

### Form Submission

**Contact Form**:
```javascript
{
  showName: true,
  showEmail: true,
  showPhone: true,
  showMessage: true,
  notificationEmail: 'info@example.com', // Ricevi notifiche
  redirectUrl: '/grazie', // Redirect dopo invio (opzionale)
}
```

## 📁 Struttura File

```
src/pages/admin/landingPages/
├── LandingPagesList.jsx          # Grid delle pagine
├── AILandingGenerator.jsx        # Form generazione AI
├── LandingPageEditor.jsx         # Editor principale ⭐
└── components/
    ├── SectionEditorCard.jsx     # Card sezione con preview
    ├── SectionPropertiesEditor.jsx  # Pannello proprietà
    ├── SectionLibraryModal.jsx   # Libreria sezioni
    └── AIAssistantModal.jsx      # Modal AI assistant
```

## 🗄️ Firestore Structure

```
tenants/{tenantId}/landingPages/{slug}/
  title: string
  slug: string (univoco)
  status: 'draft' | 'published' | 'archived'
  sections: [
    {
      id: 'section_timestamp',
      type: 'hero' | 'videoUpload' | 'contactForm' | ...,
      props: {
        // Props specifici per tipo
      }
    }
  ]
  seo: {
    metaTitle: string,
    metaDescription: string,
    ogImage: string
  }
  globalSettings: {
    primaryColor: string,
    fontFamily: string,
    buttonStyle: string
  }
  createdAt: timestamp
  updatedAt: timestamp
  updatedBy: uid
```

## 📱 Anteprima Mobile

**Frame iPhone** (375x667):
- Bordo iPhone realistico con border-radius
- Scrollbar sottile personalizzata
- Visualizzazione 1:1 come su mobile
- Toggle Desktop/Mobile nella toolbar
- Pulsante "Torna all'Editor"

**Come usare**:
1. Clicca l'icona 📱 Smartphone nella toolbar
2. Visualizza in tempo reale come appare su mobile
3. Clicca "Torna all'Editor" per modificare

## 🎨 Styling

Segue la grafica attuale dell'app:
- **Background**: bg-slate-900
- **Cards**: bg-slate-800/60 backdrop-blur-sm
- **Borders**: border-slate-700
- **Text**: text-white, text-slate-400
- **Buttons**: bg-blue-500, gradient purple-to-blue per AI
- **Mobile Frame**: bg-slate-950 con bordo slate-800

## 🔜 TODO

### Priority 1 - Public Renderer
- [ ] Create PublicLandingPage.jsx component
- [ ] Route /site/{tenantSlug}/{slug}
- [ ] Render sections dynamically
- [ ] Handle form submissions
- [ ] Handle video uploads with progress
- [ ] CTA action handlers (scroll, link, form, video)

### Priority 2 - Form Backend
- [ ] Cloud Function for form submissions
- [ ] Email notifications via SendGrid/Mailgun
- [ ] Save submissions to Firestore
- [ ] Video upload to R2 with progress tracking

### Priority 3 - AI Integration
- [ ] Integrate OpenAI/Claude API
- [ ] Replace placeholder generation with real AI
- [ ] Implement inline section editing with AI
- [ ] Content optimization suggestions

### Priority 4 - SEO & Analytics
- [ ] Meta tags injection
- [ ] Open Graph images
- [ ] Google Analytics integration
- [ ] Form conversion tracking

### Priority 5 - Advanced Features
- [ ] Custom CSS per page
- [ ] Custom domains
- [ ] A/B testing
- [ ] Templates library
- [ ] Duplicate page
- [ ] Import/Export JSON

## 💡 Best Practices

1. **Slug**: Sempre lowercase, solo a-z0-9-
2. **Status**: Tieni in draft finché non testata
3. **AI**: Rivedi sempre i contenuti generati dall'AI
4. **Images**: Comprimi prima dell'upload (fatto automaticamente)
5. **Videos**: Max 1GB, usa mp4 per compatibilità
6. **Forms**: Testa sempre l'email notification
7. **CTAs**: Verifica sempre i link e gli scroll targets

## 🐛 Troubleshooting

**Pagina non si salva**:
- Controlla titolo e slug (obbligatori)
- Slug deve essere univoco per tenant

**Upload fallisce**:
- Controlla dimensione file (1GB max video)
- Verifica formato supportato
- Controlla configurazione R2

**AI non genera**:
- Verifica API key configurata
- Prompt deve essere dettagliato
- Fallback: generazione placeholder attiva

**Preview non funziona**:
- Salva prima di visualizzare live
- Stato deve essere 'published'
- Controlla slug valido
