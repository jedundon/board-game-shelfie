# Board Game Shelf Annotator - Architecture Documentation

## System Overview
A client-side static web application with no backend dependencies. All data is stored as JSON files in the repository, served statically via GitHub Pages or similar hosting.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        GitHub Pages                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   Static Assets                        │  │
│  │  • index.html                                          │  │
│  │  • app.js / app.css                                    │  │
│  │  • /shelves/                                           │  │
│  │     ├── index.json                                     │  │
│  │     ├── james-main/                                    │  │
│  │     │   ├── manifest.json                              │  │
│  │     │   ├── image1.jpg, image2.jpg...                  │  │
│  │     │   └── annotations/                               │  │
│  │     │       ├── default.json                           │  │
│  │     │       └── friend-roast.json                      │  │
│  │     └── sarah-collection/                              │  │
│  │         └── ...                                        │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      User's Browser                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                 Single Page App                        │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │  │
│  │  │   Router     │  │    Viewer    │  │   Editor    │ │  │
│  │  │  (Hash-based)│  │   Component  │  │  Component  │ │  │
│  │  └──────────────┘  └──────────────┘  └─────────────┘ │  │
│  │  ┌────────────────────────────────────────────────────│  │
│  │  │          State Management (Simple)                 │  │
│  │  └────────────────────────────────────────────────────│  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Component Architecture

### 1. Application Core
**Responsibility**: Application initialization, routing, state management

**Key Files**:
- `index.html` - Single HTML entry point
- `app.js` - Main application logic
- `router.js` - Hash-based routing
- `state.js` - Simple state management

**Routes**:
- `/#/` or `/#/browse` - Browse all shelves
- `/#/view/:shelfId` - View shelf with default annotations
- `/#/view/:shelfId/:annotationId` - View shelf with specific annotations
- `/#/annotate/:shelfId` - Annotation editor mode

### 2. Viewer Component
**Responsibility**: Display images with annotation overlays

**Features**:
- Load and display images in grid layout
- Render annotation regions as overlays
- Show tooltips on hover
- Support annotation switching
- Responsive layout

**Subcomponents**:
- `ImageGrid` - Layout manager for images
- `AnnotationOverlay` - SVG/Canvas overlay for regions
- `Tooltip` - Hover information display
- `AnnotationSelector` - Dropdown for switching annotations

### 3. Editor Component
**Responsibility**: Create and edit annotation regions

**Features**:
- Interactive region drawing (click-drag-release)
- Region selection and editing
- Text input for labels and descriptions
- Export to JSON
- Visual feedback

**Subcomponents**:
- `Canvas` - Drawing surface
- `RegionEditor` - Form for editing region properties
- `RegionList` - List of all regions with edit/delete
- `ExportButton` - Download JSON functionality

### 4. Data Loader
**Responsibility**: Fetch and parse JSON configuration files

**Functions**:
```javascript
loadShelfIndex() → Promise<ShelfIndex>
loadShelfManifest(shelfId) → Promise<Manifest>
loadAnnotations(shelfId, annotationId) → Promise<Annotations>
```

**Caching**: Use browser cache for repeated loads

### 5. Browser Component
**Responsibility**: Display available shelves

**Features**:
- Load shelf index
- Display shelf cards with preview
- Link to viewer for each shelf

## Data Flow

### View Mode Flow
```
1. User navigates to /#/view/james-main
2. Router parses URL → { mode: 'view', shelfId: 'james-main' }
3. DataLoader fetches shelves/james-main/manifest.json
4. DataLoader fetches first annotation from manifest
5. Viewer renders images with annotation overlays
6. User hovers → Tooltip displays label/description
7. User selects different annotation → Reload annotations, re-render
```

### Annotation Mode Flow
```
1. User navigates to /#/annotate/james-main
2. Router parses URL → { mode: 'annotate', shelfId: 'james-main' }
3. DataLoader fetches manifest (images only)
4. Editor renders images in editable mode
5. User clicks and drags → Draw region rectangle
6. User enters label and description → Update region data
7. User clicks Export → Generate JSON, trigger download
8. User manually uploads JSON to GitHub repo
```

## Technology Stack

### Core Technologies
- **HTML5**: Semantic markup
- **CSS3**: Grid layout, flexbox, CSS variables
- **Vanilla JavaScript**: No framework overhead for MVP
  - Alternative: Preact (3KB) or Vue 3 if complexity grows

### Browser APIs
- **Fetch API**: Load JSON and images
- **Canvas API** or **SVG**: Draw annotation regions
- **File Download**: Export JSON files
- **URL Hash**: Client-side routing

### Build Tools (Optional)
- None required for MVP
- Optional: Vite for development server + bundling

## File Structure

```
/
├── index.html                 # Single page entry point
├── assets/
│   ├── css/
│   │   ├── main.css          # Global styles
│   │   ├── viewer.css        # Viewer component styles
│   │   └── editor.css        # Editor component styles
│   └── js/
│       ├── app.js            # Main application
│       ├── router.js         # Routing logic
│       ├── state.js          # State management
│       ├── components/
│       │   ├── viewer.js     # Viewer component
│       │   ├── editor.js     # Editor component
│       │   └── browser.js    # Shelf browser
│       └── utils/
│           └── dataLoader.js # Data fetching
├── shelves/
│   ├── index.json            # Root shelf index
│   ├── james-main/
│   │   ├── manifest.json
│   │   ├── images/
│   │   │   ├── shelf1.jpg
│   │   │   └── shelf2.jpg
│   │   └── annotations/
│   │       └── default.json
│   └── sarah-collection/
│       └── ...
└── docs/
    ├── PRD.md
    ├── ARCHITECTURE.md
    └── IMPLEMENTATION.md
```

## State Management

Simple object-based state, no complex state library needed:

```javascript
const AppState = {
  currentMode: 'browse' | 'view' | 'annotate',
  currentShelf: null,        // Manifest object
  currentAnnotations: null,  // Annotations object
  editingRegions: [],        // For editor mode
  shelfIndex: null           // List of all shelves
};
```

## Rendering Strategy

### Initial Load
1. Load minimal HTML shell
2. Parse route from URL hash
3. Fetch required JSON files
4. Render appropriate component

### Component Updates
- No virtual DOM needed
- Direct DOM manipulation for performance
- Event delegation for region interactions

### Image Loading
- Load images on-demand
- Use `loading="lazy"` attribute
- Show loading placeholders

## Security Considerations

### XSS Prevention
- Sanitize user-generated text (labels, descriptions)
- Use `textContent` instead of `innerHTML` where possible
- Validate JSON structure on load

### Data Validation
- Validate coordinate bounds
- Check image file extensions
- Verify JSON schema

### CORS
- All resources served from same origin (GitHub Pages)
- No CORS issues

## Performance Considerations

### Optimization Strategies
1. **Lazy load images**: Only load visible/needed images
2. **Debounce hover events**: Reduce tooltip flickering
3. **Cache JSON files**: Store in memory after first load
4. **Minimize reflows**: Batch DOM updates
5. **Use CSS transforms**: For smooth region highlighting

### Performance Targets
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Hover response: < 16ms (60fps)

### Bundle Size Goals
- HTML + CSS + JS: < 50KB (gzipped)
- Per-shelf JSON: < 5KB
- Images: User-controlled, recommend < 2MB each

## Browser Compatibility

### Target Browsers
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

### Required Features
- ES6+ JavaScript
- CSS Grid
- Fetch API
- Canvas or SVG
- File Download API

### Polyfills
- None required for target browsers

## Deployment

### Build Process
1. No build required for vanilla JS version
2. Optional: Run through minifier for production

### Hosting Options
1. **GitHub Pages** (recommended)
   - Push to `main` or `gh-pages` branch
   - Configure in repo settings
   - Free, reliable, HTTPS included

2. **Netlify**
   - Drag and drop deploy
   - Automatic HTTPS

3. **Vercel**
   - Connect GitHub repo
   - Auto-deploy on push

### Deployment Steps
1. Commit all code to repository
2. Add shelf images and JSON files
3. Enable GitHub Pages in settings
4. Access at `https://username.github.io/boardgameshelf`

## Future Architecture Considerations

### Scalability
- Current design supports 10-20 shelves easily
- For 100+ shelves: Consider pagination or search
- For 1000+ regions per shelf: Consider region indexing

### Extensibility
- Plugin system for custom annotation types
- Theme system via CSS variables
- Export formats (PDF, image overlays)

### Migration Path
If backend becomes necessary:
1. Add API layer (keep same data format)
2. Backend stores JSON files
3. Add authentication
4. Client code remains largely unchanged
