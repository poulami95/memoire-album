# Mémoire — AI Photo Album Studio

> Transform your photos into timeless, beautifully curated albums — powered by Claude AI.

![Mémoire Screenshot](./docs/screenshot.png)

## Features

- 📸 **Upload photos** via drag-and-drop, Google Drive link, or image URL
- 🤖 **AI curation** — Claude Vision scores every photo for quality and relevance
- 🎨 **10 occasion types** — Wedding, Birthday, Travel, Family, and more
- 📖 **6 layout styles** — Modern, Classic, Editorial, Polaroid, Cinematic, Scrapbook
- ✍️ **AI-generated captions** — Poetic, context-aware page captions
- 📄 **Flexible page count** — 4 to 100 pages, preset or custom
- 🖨️ **PDF export** — Print-ready, high-resolution PDF generated in-browser
- 🌐 **Print vendors** — Integrated links to Zoomin, PrintMyLook, Photojaanic, Blurb & more
- 🔒 **Privacy-first** — Photos never leave your browser (API calls use base64)

---

## Quick Start

### Prerequisites
- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com)

### Installation

```bash
# Clone the repo
git clone https://github.com/your-org/memoire-album.git
cd memoire-album

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local and add your REACT_APP_ANTHROPIC_API_KEY

# Start development server
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
memoire-album/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── MainLayout.tsx          # Header + step nav + layout shell
│   │   ├── AlbumPageRenderer.tsx   # Renders a single album page
│   │   └── steps/
│   │       ├── UploadStep.tsx      # Photo upload (file/Drive/URL)
│   │       ├── ConfigureStep.tsx   # Occasion, layout, page count, options
│   │       ├── ProcessingStep.tsx  # AI analysis + album generation
│   │       ├── PreviewStep.tsx     # Page-by-page preview + editing
│   │       └── ExportStep.tsx      # PDF download + print vendors
│   ├── context/
│   │   └── AlbumContext.tsx        # Global state management
│   ├── types/
│   │   └── index.ts                # TypeScript interfaces
│   ├── utils/
│   │   ├── aiService.ts            # Claude API: image analysis + album planning
│   │   └── exportService.ts        # PDF generation + print vendor data
│   ├── styles/
│   │   ├── globals.css             # Design tokens, typography, animations
│   │   ├── MainLayout.css
│   │   ├── UploadStep.css
│   │   ├── ConfigureStep.css
│   │   ├── ProcessingStep.css
│   │   ├── PreviewStep.css
│   │   └── ExportStep.css
│   ├── App.tsx
│   └── index.tsx
├── .env.example
├── package.json
├── tsconfig.json
└── TODO.md
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| State | React Context + useReducer |
| AI | Claude claude-sonnet-4-20250514 (Vision + Text) |
| PDF | jsPDF + html2canvas |
| Upload | react-dropzone |
| Animations | CSS keyframes + Framer Motion |
| Fonts | Playfair Display, Cormorant Garamond, Montserrat |
| Styling | CSS Modules + CSS custom properties |

---

## Printing Partners

| Vendor | Ships to India | Price Range | API |
|--------|---------------|-------------|-----|
| Zoomin | ✅ | ₹799–₹3,999 | ❌ |
| PrintMyLook | ✅ | ₹599–₹2,499 | ❌ |
| Photojaanic | ✅ | ₹1,200–₹5,500 | ❌ |
| Blurb | ✅ (worldwide) | $14–$120 | ✅ |
| Printing For Less | ❌ | $19–$89 | ❌ |
| Loxley Colour | ❌ | £12–£85 | ❌ |

---

## Deployment

### Vercel (recommended)
```bash
npm run build
vercel deploy
```

### Netlify
```bash
npm run build
# Drag the /build folder to Netlify Drop
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
# Serve with nginx or serve
```

---

## Contributing

See [TODO.md](./TODO.md) for planned features and known issues.

---

## License

MIT © 2025 Mémoire
