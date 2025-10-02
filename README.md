# Board Game Shelfie 📚🎲

An interactive static web app for sharing board game collections with annotated hover labels. Perfect for showing off your collection and explaining your organization system (or lack thereof!).

## Features

- 🖼️ **Multi-Image Viewer**: Display multiple shelf images in a grid layout
- 🏷️ **Interactive Annotations**: Hover over games to see labels and descriptions
- ✏️ **Annotation Editor**: Create your own annotations with a simple click-and-drag interface
- 🔄 **Multiple Perspectives**: Support multiple annotation sets per shelf (let friends roast your collection!)
- 🚀 **Static & Free**: No backend required - runs entirely on GitHub Pages
- 📱 **Responsive**: Works on desktop and mobile devices

## Live Demo

[Coming Soon]

## Quick Start

### Viewing Shelves
Simply navigate to a shelf URL:
```
https://yourusername.github.io/board-game-shelfie/#/view/shelf-name
```

### Creating Annotations
1. Visit the annotation editor: `/#/annotate/shelf-name`
2. Click and drag to draw regions on images
3. Add labels and descriptions
4. Export JSON file
5. Share with the shelf owner to upload

## Project Structure

```
/
├── index.html              # Main app entry point
├── assets/                 # CSS and JavaScript
├── shelves/                # Shelf images and annotations
│   ├── index.json         # List of all shelves
│   └── [shelf-name]/      # Individual shelf folder
│       ├── manifest.json  # Shelf metadata
│       ├── *.jpg          # Shelf images
│       └── annotations/   # Annotation files
└── docs/                  # Project documentation
```

## Documentation

- [Product Requirements](docs/PRD.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Implementation Plan](docs/IMPLEMENTATION.md)

## Technology

- Pure HTML/CSS/JavaScript (no framework required)
- SVG overlays for annotations
- Hash-based routing for navigation
- JSON for data storage

## Development Status

🚧 **In Development** - See [IMPLEMENTATION.md](docs/IMPLEMENTATION.md) for current progress

## Contributing

This is currently a personal project, but feel free to fork and adapt for your own collection!

## License

MIT License - feel free to use and modify for your own board game shelves!

---

Made with ❤️ for board game enthusiasts
