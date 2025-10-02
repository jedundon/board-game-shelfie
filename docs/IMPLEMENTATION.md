# Board Game Shelf Annotator - Implementation Plan

## Project Setup

### Phase 0: Repository Setup ✓
- [x] Create project repository
- [x] Create docs folder
- [x] Write PRD, Architecture, and Implementation docs
- [ ] Create initial folder structure
- [ ] Add README.md with project overview
- [ ] Set up .gitignore

## Implementation Phases

## Phase 1: Foundation & Viewer (MVP Part 1)

### Milestone 1.1: Basic Project Structure
**Time Estimate**: 2-3 hours

**Tasks**:
1. Create HTML scaffold
   - [ ] Create `index.html` with basic structure
   - [ ] Add meta tags, viewport settings
   - [ ] Link CSS and JS files

2. Create CSS foundation
   - [ ] Create `assets/css/main.css` with CSS variables
   - [ ] Create `assets/css/viewer.css`
   - [ ] Set up responsive grid system
   - [ ] Define color scheme and typography

3. Create JavaScript foundation
   - [ ] Create `assets/js/app.js` - main entry point
   - [ ] Create `assets/js/router.js` - hash routing
   - [ ] Create `assets/js/state.js` - state management
   - [ ] Create `assets/js/utils/dataLoader.js`

4. Set up example shelf structure
   - [ ] Create `shelves/index.json`
   - [ ] Create `shelves/james-main/` folder
   - [ ] Copy your 6 board game images
   - [ ] Create initial `manifest.json`

**Deliverable**: Empty app shell that loads and displays "Hello World"

### Milestone 1.2: Data Loading & Routing
**Time Estimate**: 3-4 hours

**Tasks**:
1. Implement hash router
   - [ ] Parse URL hash into route objects
   - [ ] Handle route changes (hashchange event)
   - [ ] Implement route handlers for each mode
   - [ ] Add 404/default route handling

2. Implement data loader
   - [ ] `loadShelfIndex()` - fetch shelves/index.json
   - [ ] `loadShelfManifest(shelfId)` - fetch manifest
   - [ ] `loadAnnotations(shelfId, annotationId)` - fetch annotations
   - [ ] Error handling for missing files
   - [ ] Basic in-memory caching

3. Test with dummy data
   - [ ] Create test shelf with 2 images
   - [ ] Create test annotation JSON
   - [ ] Verify loading in browser console

**Deliverable**: Router works, data loads successfully

### Milestone 1.3: Image Viewer Component
**Time Estimate**: 4-5 hours

**Tasks**:
1. Create viewer component
   - [ ] Create `assets/js/components/viewer.js`
   - [ ] Implement image grid layout (CSS Grid)
   - [ ] Load and display images from manifest
   - [ ] Handle image load errors
   - [ ] Add loading states/spinners

2. Implement annotation overlays
   - [ ] Choose SVG vs Canvas (recommend SVG for simplicity)
   - [ ] Create overlay layer per image
   - [ ] Draw rectangles based on annotation coordinates
   - [ ] Style regions (border, fill, opacity)

3. Add hover interactions
   - [ ] Detect mouse enter/leave on regions
   - [ ] Show tooltip with label and description
   - [ ] Position tooltip intelligently (avoid edge overflow)
   - [ ] Add smooth transitions

4. Add annotation selector
   - [ ] Create dropdown component
   - [ ] Populate from manifest.annotations
   - [ ] Handle selection change
   - [ ] Reload and display new annotations

**Deliverable**: Fully functional viewer with hover annotations

**Test Cases**:
- [ ] Load shelf with multiple images
- [ ] Switch between annotation sets
- [ ] Hover shows correct tooltips
- [ ] Works on different screen sizes

---

## Phase 2: Annotation Editor (MVP Part 2)

### Milestone 2.1: Editor UI Setup
**Time Estimate**: 3-4 hours

**Tasks**:
1. Create editor component
   - [ ] Create `assets/js/components/editor.js`
   - [ ] Create `assets/css/editor.css`
   - [ ] Display images in edit mode (no overlays yet)
   - [ ] Add mode toggle UI

2. Create editor sidebar
   - [ ] Region list panel
   - [ ] Region properties form (label, description)
   - [ ] Export button
   - [ ] Clear/reset button

3. Wire up routing
   - [ ] Handle `/#/annotate/:shelfId` route
   - [ ] Load shelf manifest
   - [ ] Initialize editor mode

**Deliverable**: Editor UI loads, no drawing yet

### Milestone 2.2: Region Drawing
**Time Estimate**: 5-6 hours

**Tasks**:
1. Implement click-and-drag drawing
   - [ ] Add mousedown event listener on images
   - [ ] Track mouse position during drag
   - [ ] Draw preview rectangle during drag
   - [ ] Create region on mouseup
   - [ ] Validate region (minimum size)

2. Store region data
   - [ ] Create Region class/object structure
   - [ ] Store in editor state
   - [ ] Assign unique IDs to regions
   - [ ] Calculate coordinates relative to image

3. Display existing regions
   - [ ] Render all regions as overlays
   - [ ] Highlight on hover
   - [ ] Show selected state
   - [ ] Display region numbers/labels

4. Handle region selection
   - [ ] Click region to select
   - [ ] Show selection highlight
   - [ ] Load properties into form
   - [ ] Deselect on background click

**Deliverable**: Can draw and select regions on images

**Test Cases**:
- [ ] Draw multiple regions on same image
- [ ] Draw regions on different images
- [ ] Select and deselect regions
- [ ] Visual feedback is clear

### Milestone 2.3: Region Editing & Export
**Time Estimate**: 4-5 hours

**Tasks**:
1. Implement region editing
   - [ ] Edit label/description in form
   - [ ] Update region on form change
   - [ ] Delete selected region (button + keyboard)
   - [ ] Clear all regions (with confirmation)

2. Add keyboard shortcuts
   - [ ] Delete key to remove selected region
   - [ ] Escape to deselect
   - [ ] Tab through regions

3. Implement JSON export
   - [ ] Create `assets/js/utils/export.js`
   - [ ] Serialize regions to annotation JSON format
   - [ ] Add metadata (version, created timestamp)
   - [ ] Trigger file download
   - [ ] Generate filename based on shelf ID

4. Add validation
   - [ ] Require label for each region
   - [ ] Check coordinate bounds
   - [ ] Warn about overlapping regions (optional)

**Deliverable**: Complete annotation editor with export

**Test Cases**:
- [ ] Create regions, add text, export JSON
- [ ] Exported JSON is valid format
- [ ] Exported JSON can be loaded in viewer
- [ ] Edit and delete regions work correctly

---

## Phase 3: Shelf Browser & Polish

### Milestone 3.1: Shelf Browser
**Time Estimate**: 3-4 hours

**Tasks**:
1. Create browser component
   - [ ] Create `assets/js/components/browser.js`
   - [ ] Create grid/list layout for shelves
   - [ ] Display shelf cards with metadata
   - [ ] Add preview thumbnails (first image)

2. Implement shelf listing
   - [ ] Load shelves/index.json
   - [ ] Fetch each shelf's manifest
   - [ ] Display shelf name, author, image count
   - [ ] Link to viewer for each shelf

3. Add navigation
   - [ ] Home/browse link in header
   - [ ] Back navigation from viewer/editor
   - [ ] Breadcrumb navigation

**Deliverable**: Browse page showing all available shelves

### Milestone 3.2: UI Polish
**Time Estimate**: 4-5 hours

**Tasks**:
1. Improve visual design
   - [ ] Refine color scheme
   - [ ] Add icons (view, edit, download)
   - [ ] Improve button styles
   - [ ] Polish form inputs
   - [ ] Add subtle animations

2. Responsive design
   - [ ] Test on mobile viewports
   - [ ] Adjust grid layouts for small screens
   - [ ] Make tooltips work on touch (tap to show)
   - [ ] Hide editor on mobile (show message)

3. Loading states
   - [ ] Add loading spinners
   - [ ] Skeleton screens for images
   - [ ] Progress indicators

4. Error handling
   - [ ] Friendly error messages
   - [ ] 404 page for missing shelves
   - [ ] Network error recovery
   - [ ] Invalid JSON handling

**Deliverable**: Polished, professional-looking UI

### Milestone 3.3: Documentation & Examples
**Time Estimate**: 2-3 hours

**Tasks**:
1. Create user documentation
   - [ ] README.md with overview
   - [ ] USAGE.md - how to view shelves
   - [ ] AUTHORING.md - how to create shelves
   - [ ] FAQ.md

2. Add example shelf
   - [ ] Create sample shelf with annotations
   - [ ] Include diverse annotation examples
   - [ ] Show different annotation styles

3. Add inline help
   - [ ] Help tooltips in editor
   - [ ] Instructions on first visit
   - [ ] Link to documentation

**Deliverable**: Complete documentation for users

---

## Phase 4: Testing & Deployment

### Milestone 4.1: Testing
**Time Estimate**: 3-4 hours

**Tasks**:
1. Manual testing
   - [ ] Test all routes
   - [ ] Test viewer with multiple shelves
   - [ ] Test editor workflow end-to-end
   - [ ] Test on different browsers (Chrome, Firefox, Safari)
   - [ ] Test on different screen sizes

2. Edge case testing
   - [ ] Empty shelves
   - [ ] Shelves with many images (10+)
   - [ ] Annotations with long text
   - [ ] Missing images
   - [ ] Malformed JSON

3. Performance testing
   - [ ] Measure load times
   - [ ] Check hover responsiveness
   - [ ] Test with large images
   - [ ] Monitor memory usage

**Deliverable**: Bug-free, tested application

### Milestone 4.2: Initial Deployment
**Time Estimate**: 1-2 hours

**Tasks**:
1. Prepare for deployment
   - [ ] Optimize images (compress if needed)
   - [ ] Minify CSS/JS (optional)
   - [ ] Test with production URLs
   - [ ] Update any hardcoded paths

2. Deploy to GitHub Pages
   - [ ] Push to repository
   - [ ] Enable GitHub Pages in settings
   - [ ] Configure custom domain (optional)
   - [ ] Test deployed version

3. Share initial version
   - [ ] Create example annotation for your shelves
   - [ ] Share URL with friends
   - [ ] Gather initial feedback

**Deliverable**: Live, deployed application

---

## Phase 5: Your Content Creation

### Milestone 5.1: Add Your Shelves
**Time Estimate**: 2-3 hours

**Tasks**:
1. Organize your images
   - [ ] Compress images if needed
   - [ ] Rename consistently
   - [ ] Upload to shelves folder

2. Create annotations
   - [ ] Use editor to annotate first shelf
   - [ ] Add humorous and informative labels
   - [ ] Export and upload JSON
   - [ ] Test in viewer

3. Share with friends
   - [ ] Share viewer URL
   - [ ] Ask friends to create roast annotations
   - [ ] Upload friend annotations
   - [ ] Share new URLs

**Deliverable**: Your personal board game shelves online!

---

## Future Enhancements (Post-MVP)

### Potential Features
1. **Advanced Editor**
   - [ ] Resize and move existing regions
   - [ ] Copy/paste regions
   - [ ] Region templates
   - [ ] Undo/redo stack

2. **Viewer Enhancements**
   - [ ] Image zoom/pan
   - [ ] Keyboard navigation
   - [ ] Direct link to specific image
   - [ ] Print view

3. **Data Features**
   - [ ] Import existing annotations
   - [ ] Merge annotation sets
   - [ ] Statistics dashboard
   - [ ] Search across annotations

4. **Customization**
   - [ ] Theme selector (dark mode)
   - [ ] Custom annotation colors
   - [ ] Layout options (grid vs list)

5. **Social Features**
   - [ ] Embed code for sharing
   - [ ] Social media preview cards
   - [ ] Comment system (via GitHub Issues?)

---

## Risk Mitigation

### Technical Risks
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Image file size too large | Medium | High | Add file size guidelines, compression docs |
| Browser compatibility issues | Low | Medium | Test early on target browsers |
| Performance with many annotations | Medium | Medium | Test with large datasets, add pagination if needed |
| JSON format breaking changes | Low | High | Version annotations, add migration support |

### User Experience Risks
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Editor too complex | Medium | High | Focus on simplicity, add inline help |
| Upload workflow confusing | Medium | Medium | Clear documentation, wizard-style UI |
| Mobile viewing poor | Low | Low | Responsive design, test on devices |

---

## Development Guidelines

### Code Style
- Use ES6+ features
- Consistent naming: camelCase for variables/functions
- Comment complex logic
- Keep functions small and focused

### Git Workflow
- Commit frequently with clear messages
- One feature per commit when possible
- Tag milestones (v0.1, v0.2, etc.)

### Testing Approach
- Manual testing for MVP
- Document test cases
- Test each milestone before moving on

### Documentation
- Update docs as features change
- Include code comments
- Keep README current

---

## Success Criteria

### MVP Complete When:
- [x] Can view multiple shelves with annotations
- [x] Can create and export annotations
- [x] Can switch between annotation sets
- [x] Works on GitHub Pages
- [x] Documentation complete
- [x] Your shelves are live and shared

### Definition of Done for Each Task:
- Code works as expected
- Tested manually
- No console errors
- Responsive on desktop
- Committed to repository

---

## Time Estimate Summary

| Phase | Estimated Hours |
|-------|----------------|
| Phase 1: Foundation & Viewer | 9-12 hours |
| Phase 2: Annotation Editor | 12-15 hours |
| Phase 3: Browser & Polish | 9-12 hours |
| Phase 4: Testing & Deployment | 4-6 hours |
| Phase 5: Content Creation | 2-3 hours |
| **Total MVP** | **36-48 hours** |

**Recommended Schedule**:
- Week 1-2: Phases 1-2 (core functionality)
- Week 3: Phase 3 (polish)
- Week 4: Phases 4-5 (deploy and use)

---

## Getting Started

### Immediate Next Steps:
1. Create folder structure
2. Set up index.html and basic CSS
3. Create test shelf with 1-2 images
4. Implement basic routing
5. Build viewer component

### First Working Demo Goal:
- Display one shelf with two images
- Show static annotations on hover
- Should take ~4-6 hours

### Tools Needed:
- Code editor (VS Code)
- Modern browser with DevTools
- Git for version control
- Image editing tool (optional, for compression)

---

## Questions & Decisions Log

### Open Questions:
1. Should annotations have categories/types?
   - Answer: Not in MVP, add in V2 if needed

2. Maximum annotation length?
   - Answer: Label: 50 chars, Description: 200 chars

3. Support for multiple image layouts?
   - Answer: Start with simple grid, can add custom layouts later

4. Allow anonymous annotation creation?
   - Answer: Yes, anyone with URL can create, but must send file to owner

### Design Decisions:
- **SVG vs Canvas**: Use SVG for easier DOM manipulation
- **Framework**: Vanilla JS for MVP, can migrate to framework later
- **Image format**: Support JPG and PNG
- **Coordinate system**: Pixels relative to natural image size
- **Browser target**: Modern browsers only (last 2 versions)

---

## Appendix: File Templates

### Minimal index.html Template
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Board Game Shelf Annotator</title>
    <link rel="stylesheet" href="assets/css/main.css">
</head>
<body>
    <div id="app">
        <header>
            <h1>Board Game Shelf Annotator</h1>
            <nav id="nav"></nav>
        </header>
        <main id="main"></main>
    </div>
    <script type="module" src="assets/js/app.js"></script>
</body>
</html>
```

### Example Shelf Manifest
```json
{
  "name": "James's Main Collection",
  "author": "James",
  "description": "My primary board game shelf",
  "images": ["image1.jpg", "image2.jpg"],
  "layout": "grid-2x3",
  "annotations": [
    {
      "id": "default",
      "name": "My Organization System",
      "author": "James",
      "file": "annotations/default.json"
    }
  ]
}
```

### Example Annotation File
```json
{
  "version": "1.0",
  "created": "2025-10-01T12:00:00Z",
  "regions": [
    {
      "imageIndex": 0,
      "x": 100,
      "y": 150,
      "width": 200,
      "height": 80,
      "label": "Party Games",
      "description": "Games that shine with 6+ players"
    }
  ]
}
```
