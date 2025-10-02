// Main application entry point
import { Router } from './router.js';
import { setState } from './state.js';
import { renderBrowser } from './components/browser.js';
import { renderViewer } from './components/viewer.js';
import { renderEditor } from './components/editor.js';

// Initialize router
const router = new Router();

// Register routes
router.addRoute('browse', async (route) => {
    setState({ currentMode: 'browse' });
    await renderBrowser();
});

router.addRoute('view', async (route) => {
    if (!route.shelfId) {
        throw new Error('Shelf ID is required for view mode');
    }
    
    setState({ 
        currentMode: 'view',
        currentShelfId: route.shelfId,
        currentAnnotationId: route.annotationId
    });
    
    await renderViewer(route.shelfId, route.annotationId);
});

router.addRoute('annotate', async (route) => {
    if (!route.shelfId) {
        throw new Error('Shelf ID is required for annotate mode');
    }
    
    setState({ 
        currentMode: 'annotate',
        currentShelfId: route.shelfId,
        editingRegions: []
    });
    
    await renderEditor(route.shelfId);
});

// Export router for other modules
export { router };

console.log('Board Game Shelfie initialized!');
