# Board Game Shelf Annotator - Product Requirements Document

## Overview
An interactive static web application for sharing board game collections with annotated hover labels. Users can view shelves with contextual information overlaid on images, and create their own annotation sets to share different perspectives on the same collection.

## Problem Statement
Board game collectors want to share their collections online in an engaging way that:
- Shows physical organization approaches
- Provides context about specific games or sections
- Allows for commentary (both serious and humorous)
- Works without requiring server infrastructure
- Enables friends to add their own commentary/annotations

## Goals
1. Create a static web app that can be hosted on GitHub Pages
2. Support multiple shelf collections (different users/rooms)
3. Allow multiple annotation sets per shelf (different perspectives)
4. Provide an intuitive annotation editor with export capability
5. Generate shareable URLs for specific shelf + annotation combinations

## Non-Goals
- User authentication/accounts
- Backend storage (all file uploads manual to GitHub)
- Image hosting from users (images manually added to repo)
- Real-time collaboration
- Mobile annotation editing (view-only mobile is fine)

## User Personas

### Primary User (Shelf Owner)
- Board game enthusiast
- Wants to share collection with friends
- Comfortable with basic GitHub operations (upload files)
- Wants to explain organization system or make jokes

### Secondary User (Friend/Commentator)
- Views shared shelves
- May want to create alternative annotations ("roast mode")
- Downloads annotation file and sends back to owner
- Less technical - just uses the web interface

### Tertiary User (Viewer)
- Just wants to browse annotated shelves
- No editing needed
- May browse on mobile

## Features

### Must Have (MVP)
1. **View Mode**
   - Display multiple images in a grid layout
   - Show hover tooltips when mouse over annotated regions
   - Support multiple images per shelf
   - Annotation selector dropdown
   - Shareable URLs

2. **Annotation Editor**
   - Click and drag to draw rectangular regions
   - Add label and description text
   - Edit/delete existing regions
   - Export JSON file for download
   - Visual feedback while drawing

3. **Shelf Management**
   - Browse available shelves
   - List annotation sets per shelf
   - Support metadata (shelf name, author, description)

### Should Have (V2)
- Touch support for tablet viewing
- Keyboard shortcuts in editor
- Undo/redo in annotation editor
- Color coding for annotation types
- Search/filter shelves

### Could Have (Future)
- Different annotation shapes (circles, polygons)
- Image zoom/pan
- Annotation categories/tags
- Statistics (most annotated games, etc.)
- Theme customization

### Won't Have
- User accounts
- Backend server
- Direct image upload
- In-app file upload to GitHub
- Comments/discussion threads

## User Workflows

### Workflow 1: Owner Creates New Shelf
1. Create folder in `/shelves/[shelf-id]/`
2. Upload images to folder
3. Create `manifest.json` with image list
4. Navigate to `/#/annotate/[shelf-id]`
5. Draw regions and add annotations
6. Export `default.json`
7. Upload to `/shelves/[shelf-id]/annotations/`
8. Update manifest with annotation metadata
9. Share view URL with friends

### Workflow 2: Friend Creates Roast Annotations
1. Owner sends `/#/annotate/[shelf-id]` link
2. Friend opens link, sees owner's images
3. Friend draws their own annotation regions
4. Friend exports `friend-roast.json`
5. Friend sends JSON file back to owner
6. Owner uploads to annotations folder
7. Owner updates manifest
8. New URL available: `/#/view/[shelf-id]/friend-roast`

### Workflow 3: Viewer Browses Shelves
1. Navigate to `/#/browse`
2. See list of available shelves
3. Click on a shelf
4. View annotated images with default annotation set
5. Switch to different annotation set from dropdown
6. Hover over regions to see labels/descriptions

## Technical Requirements

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge) - last 2 versions
- JavaScript enabled
- Canvas or SVG support

### Performance
- Initial load < 3 seconds
- Image load on-demand or lazy loading
- Smooth hover interactions (< 16ms response)

### Data Formats
- Images: JPG, PNG (recommended max 2MB each)
- All configuration in JSON
- Coordinates in pixels relative to image dimensions

### Hosting
- Static hosting (GitHub Pages, Netlify, Vercel)
- No server-side processing required
- All resources loaded via HTTPS

## Data Schema

### Root Index (`/shelves/index.json`)
```json
{
  "shelves": [
    {
      "id": "shelf-identifier",
      "path": "shelf-folder/manifest.json"
    }
  ]
}
```

### Shelf Manifest (`/shelves/[id]/manifest.json`)
```json
{
  "name": "Display Name",
  "author": "Owner Name",
  "description": "Optional description",
  "images": ["image1.jpg", "image2.jpg"],
  "layout": "grid-2x3",
  "annotations": [
    {
      "id": "annotation-id",
      "name": "Display Name",
      "author": "Author Name",
      "file": "annotations/filename.json"
    }
  ]
}
```

### Annotation File (`/shelves/[id]/annotations/[name].json`)
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
      "label": "Short Label",
      "description": "Longer hover description"
    }
  ]
}
```

## Success Metrics
- Successfully share personal collection with friends
- Friends can create and share annotation sets
- App loads and functions without backend
- Positive feedback from viewers
- Others want to create their own shelves

## Open Questions
1. Should we support mobile annotation editing or just viewing?
   - **Decision**: View-only for mobile in MVP
2. Maximum number of images per shelf?
   - **Decision**: Start with 6-10, can expand if performance allows
3. Should annotations be color-coded by author?
   - **Decision**: V2 feature
4. How to handle image aspect ratios in grid?
   - **Decision**: Maintain aspect ratio, use CSS grid with auto-fit

## Timeline
- **Phase 1 (MVP)**: Basic viewer + annotation editor + export
- **Phase 2**: Polish UI, add shelf browser, improve UX
- **Phase 3**: Additional features based on usage feedback
