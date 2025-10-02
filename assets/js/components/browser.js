// Browser component - displays list of available shelves
import { loadShelfIndex, loadShelfManifest } from '../utils/dataLoader.js';

export async function renderBrowser() {
    const main = document.getElementById('main');
    
    // Show loading state
    main.innerHTML = `
        <div class="container">
            <h2>Available Shelves</h2>
            <div class="loading">
                <div class="spinner"></div>
                <p>Loading shelves...</p>
            </div>
        </div>
    `;
    
    try {
        const index = await loadShelfIndex();
        
        if (!index.shelves || index.shelves.length === 0) {
            main.innerHTML = `
                <div class="container">
                    <h2>Available Shelves</h2>
                    <div class="message message-info">
                        <p>No shelves available yet. Check back soon!</p>
                    </div>
                </div>
            `;
            return;
        }
        
        // Load manifests for all shelves
        const shelvesWithData = await Promise.all(
            index.shelves.map(async (shelf) => {
                try {
                    const manifest = await loadShelfManifest(shelf.id);
                    return { ...shelf, manifest };
                } catch (error) {
                    console.error(`Failed to load manifest for ${shelf.id}:`, error);
                    return { ...shelf, manifest: null };
                }
            })
        );
        
        // Render shelf cards
        const shelfCards = shelvesWithData
            .filter(shelf => shelf.manifest)
            .map(shelf => createShelfCard(shelf))
            .join('');
        
        main.innerHTML = `
            <div class="container">
                <h2>Available Shelves</h2>
                <div class="grid grid-2">
                    ${shelfCards}
                </div>
            </div>
        `;
    } catch (error) {
        main.innerHTML = `
            <div class="container">
                <div class="message message-error">
                    <h2>Error Loading Shelves</h2>
                    <p>${error.message}</p>
                </div>
            </div>
        `;
    }
}

function createShelfCard(shelf) {
    const { id, manifest } = shelf;
    const imageCount = manifest.images?.length || 0;
    const annotationCount = manifest.annotations?.length || 0;
    const firstImage = manifest.images?.[0] ? `shelves/${id}/${manifest.images[0]}` : '';
    
    return `
        <div class="card">
            ${firstImage ? `
                <div style="margin-bottom: var(--spacing-md); border-radius: var(--border-radius); overflow: hidden;">
                    <img src="${firstImage}" alt="${manifest.name}" style="width: 100%; height: 200px; object-fit: cover;">
                </div>
            ` : ''}
            <h3>${manifest.name || id}</h3>
            <p class="text-muted mb-md">By ${manifest.author || 'Unknown'}</p>
            ${manifest.description ? `<p class="mb-md">${manifest.description}</p>` : ''}
            <p class="text-muted mb-md">
                📷 ${imageCount} image${imageCount !== 1 ? 's' : ''} • 
                🏷️ ${annotationCount} annotation${annotationCount !== 1 ? 's' : ''}
            </p>
            <div style="display: flex; gap: var(--spacing-sm);">
                <a href="#/view/${id}" class="btn">View Shelf</a>
                <a href="#/annotate/${id}" class="btn btn-outline">Annotate</a>
            </div>
        </div>
    `;
}
