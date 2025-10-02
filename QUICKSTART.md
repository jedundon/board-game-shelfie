# Quick Start Guide

## Your Board Game Shelfie is Live! 🎲

**Site URL**: https://jedundon.github.io/board-game-shelfie/

## Quick Links

- **Browse All Shelves**: https://jedundon.github.io/board-game-shelfie/#/browse
- **View Your Shelf**: https://jedundon.github.io/board-game-shelfie/#/view/james-main
- **Annotate Your Shelf**: https://jedundon.github.io/board-game-shelfie/#/annotate/james-main

## Next Steps

### 1. Create Your Annotations

1. Visit the annotate link above
2. Click and drag on your shelf images to create regions
3. Add funny or informative labels and descriptions
4. Click "Download JSON" when done
5. Save the file as `default.json`

### 2. Upload Your Annotations

```bash
# Replace the default.json file
cp ~/Downloads/james-main-*.json shelves/james-main/annotations/default.json

# Commit and push
git add shelves/james-main/annotations/default.json
git commit -m "Add my annotations to james-main shelf"
git push
```

### 3. Share With Friends!

Share your view URL: `https://jedundon.github.io/board-game-shelfie/#/view/james-main`

## Adding Friend Annotations

When friends create their own annotations for your shelf:

1. They visit: `https://jedundon.github.io/board-game-shelfie/#/annotate/james-main`
2. They create annotations and export the JSON
3. They send you the JSON file
4. You save it as: `shelves/james-main/annotations/friend-name.json`
5. Update `manifest.json` to add their annotation set:

```json
{
  "annotations": [
    {
      "id": "default",
      "name": "My Organization System",
      "author": "James",
      "file": "annotations/default.json"
    },
    {
      "id": "sarah-roast",
      "name": "Sarah's Roast",
      "author": "Sarah",
      "file": "annotations/sarah-roast.json"
    }
  ]
}
```

6. Commit and push
7. Share new URL: `https://jedundon.github.io/board-game-shelfie/#/view/james-main/sarah-roast`

## Creating Additional Shelves

To add more shelves (e.g., different rooms, friend collections):

```bash
# Create new shelf folder
mkdir -p shelves/new-shelf-id/images
mkdir -p shelves/new-shelf-id/annotations

# Add images to images folder
# Create manifest.json (copy from james-main as template)
# Create empty annotations/default.json

# Add to shelves/index.json
# Commit and push
```

## Tips

- **Image Size**: Keep images under 2MB each for best performance
- **Annotations**: Be specific with labels, have fun with descriptions!
- **Mobile**: Best viewed on desktop, but mobile viewing works fine
- **Sharing**: Each annotation set gets its own URL for easy sharing

## Troubleshooting

- **Images not showing?** Check file paths in manifest.json
- **Annotations not appearing?** Verify JSON is valid and properly formatted
- **Site not updating?** GitHub Pages can take 1-2 minutes to deploy changes

## Project Structure

```
shelves/
  james-main/
    manifest.json          ← Shelf config
    images/
      shelf1.jpg          ← Your photos
      shelf2.jpg
      ...
    annotations/
      default.json        ← Your annotations
      friend-roast.json   ← Friend annotations
```

Enjoy your Board Game Shelfie! 🎮📚
