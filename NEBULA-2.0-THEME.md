# 🌌 NEBULA 2.0 - Theme System

## Panoramica

Il tema **Nebula 2.0** è un redesign completo dell'interfaccia utente FitFlow Pro, che passa da una palette Sky/Cyan a una più moderna e elegante **Violet/Fuchsia**.

### Filosofia del Design
- **Più leggero**: Ridotto il blur dei glassmorphism, animazioni più lente e rilassanti
- **Meno stelle**: Da 40 a 25 particelle, più piccole e con animazioni più lente
- **Colori più caldi**: Viola e fucsia creano un'atmosfera più accogliente del blu

---

## 🎨 Palette Colori

### Colori Primari
| Nome | Valore Hex | Uso |
|------|-----------|-----|
| Violet 500 | `#8b5cf6` | Accent primario, bottoni, link |
| Violet 400 | `#a78bfa` | Testi accent, hover states |
| Fuchsia 500 | `#e879f9` | Accent secondario, gradient |
| Fuchsia 400 | `#f0abfc` | Hover accent, highlights |

### Background
| Nome | Valore | Uso |
|------|--------|-----|
| bg-primary | `#0a0f1a` | Background principale |
| bg-secondary | `#111827` | Card, sidebar |
| bg-tertiary | `#1f2937` | Hover states |

### Colori Interattivi (invariati)
| Nome | Valore | Uso |
|------|--------|-----|
| Cyan 400 | `#22d3ee` | Link interattivi, accent secondario |
| Emerald 500 | `#10b981` | Successo, stati attivi |
| Amber 500 | `#f59e0b` | Warning |
| Rose 500 | `#f43f5e` | Errori, danger |

---

## ✨ Effetti Glassmorphism

### Glass Base
```css
.glass {
  background: rgba(17, 24, 39, 0.8);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(139, 92, 246, 0.15);
}
```

### Glass Glow
```css
.glass-glow {
  background: rgba(17, 24, 39, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(139, 92, 246, 0.2);
  box-shadow: 0 0 30px rgba(139, 92, 246, 0.1);
}
```

---

## 🌟 Animazioni Stelle

### Configurazione
- **Numero**: 25 particelle (ridotto da 40)
- **Dimensioni**: 1-2.5px (più piccole)
- **Durata animazione**: 18-30s (più lente)
- **Colori**: Viola, Fucsia, Cyan, Indigo

### Varianti Colore Stelle
```js
const starColors = ['', 'gold', 'indigo', 'cyan'];
// '' = viola default (#a78bfa)
// 'gold' = fucsia (#e879f9)
// 'indigo' = viola chiaro (#c4b5fd)
// 'cyan' = cyan accent (#22d3ee)
```

---

## 🎯 Classi Utility

### Gradienti
```css
.gradient-primary    /* Violet → Fuchsia */
.gradient-secondary  /* Violet → Violet scuro */
.gradient-nebula     /* Violet → Fuchsia → Rosa */
.gradient-premium    /* Violet → Fuchsia brillante */
```

### Glow Effects
```css
.glow-violet   /* Box shadow viola */
.glow-fuchsia  /* Box shadow fucsia */
.glow-cyan     /* Box shadow cyan (accent) */
.glow-pulse    /* Animazione pulsante */
```

---

## 📁 File Modificati

| File | Descrizione |
|------|-------------|
| `tailwind.config.cjs` | Palette colori Nebula 2.0, shadows, animations |
| `src/index.css` | CSS variables, glassmorphism, stelle |
| `src/config/designSystem.js` | Design tokens V6 |
| `src/components/layout/ProLayout.jsx` | AnimatedStars config, bottom nav |
| `src/components/layout/ProSidebar.jsx` | Nav items, logos |

---

## 🔄 Migrazione da V5 (Sky/Cyan)

### Sostituzioni Principali
| Da (V5) | A (V6 Nebula) |
|---------|---------------|
| `sky-500` | `violet-500` |
| `sky-400` | `violet-400` |
| `cyan-500` | `fuchsia-500` |
| `cyan-400` | `fuchsia-400` |
| `blue-500` | `violet-500` |
| `blue-400` | `violet-400` |

### Nota
- Il **cyan** rimane come colore interattivo secondario
- I colori di stato (success, warning, error) sono **invariati**
- Il tema **light** non è ancora stato aggiornato

---

## 🚀 Prossimi Step

1. [ ] Aggiornare tema light con palette Nebula
2. [ ] Verificare tutti i componenti custom
3. [ ] Testare su mobile
4. [ ] Aggiornare logo/favicon con nuovi colori

---

*Ultimo aggiornamento: Design System V6 - Nebula 2.0*
