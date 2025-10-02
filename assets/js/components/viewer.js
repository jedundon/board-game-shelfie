// Viewer component - displays shelf images with annotation overlays
import { loadShelfManifest, loadAnnotations } from '../utils/dataLoader.js';
import { setState, getState } from '../state.js';

let tooltip = null;

export async function renderViewer(shelfId, annotationId) {
    const main = document.getElementById('main');
    
    // Show loading state
    main.innerHTML = `
        <div class="container">
            <div class="loading">
                <div class="spinner"></div>
                <p>Loading shelf...</p>
            </div>
        </div>
    `;
    
    try {
        // Load manifest
        const manifest = await loadShelfManifest(shelfId);
        setState({ currentShelf: manifest });
        
        // Determine which annotation to load
        const selectedAnnotationId = annotationId || manifest.annotations?.[0]?.id;
        
        let annotations = null;
        if (selectedAnnotationId) {
            try {
                annotations = await loadAnnotations(shelfId, selectedAnnotationId);
                console.log('Loaded annotations:', annotations);
                console.log('Number of regions:', annotations?.regions?.length || 0);
                setState({ 
                    currentAnnotations: annotations,
                    currentAnnotationId: selectedAnnotationId 
                });
            } catch (error) {
                console.error('Failed to load annotations:', error);
            }
        }
        
        // Render viewer UI
        renderViewerUI(shelfId, manifest, annotations, selectedAnnotationId);
        
        // Create tooltip element if it doesn't exist
        if (!tooltip) {
            tooltip = createTooltip();
        }
        
    } catch (error) {
        main.innerHTML = `
            <div class="container">
                <div class="message message-error">
                    <h2>Error Loading Shelf</h2>
                    <p>${error.message}</p>
                    <a href="#/browse" class="btn">Back to Browse</a>
                </div>
            </div>
        `;
    }
}

function renderViewerUI(shelfId, manifest, annotations, selectedAnnotationId) {
    const main = document.getElementById('main');
    
    const annotationSelector = manifest.annotations?.length > 0 ? `
        <div class="annotation-selector">
            <label for="annotation-select">View annotations by:</label>
            <select id="annotation-select" onchange="window.location.hash = '#/view/${shelfId}/' + this.value">
                ${manifest.annotations.map(a => `
                    <option value="${a.id}" ${a.id === selectedAnnotationId ? 'selected' : ''}>
                        ${a.name} by ${a.author}
                    </option>
                `).join('')}
            </select>
        </div>
    ` : '';
    
    main.innerHTML = `
        <div class="viewer-container">
            <div class="viewer-header">
                <div class="shelf-info">
                    <h2 class="shelf-title">${manifest.name || shelfId}</h2>
                    <p class="shelf-meta">By ${manifest.author || 'Unknown'}</p>
                    <a href="#/annotate/${shelfId}" class="btn btn-outline">
                        ✏️ Annotate
                    </a>
                    <a href="#/browse" class="btn btn-secondary">
                        ← Browse
                    </a>
                </div>
                ${annotationSelector}
            </div>
            
            <div class="image-grid" id="image-grid">
                ${renderImages(shelfId, manifest, annotations)}
            </div>
            
            <div class="annotation-subtitle" id="annotation-subtitle">
                <h3 class="annotation-subtitle-label" id="subtitle-label"></h3>
                <p class="annotation-subtitle-description" id="subtitle-description"></p>
            </div>
            
            <div class="scroll-hint" id="scroll-hint">→</div>
        </div>
    `;
    
    // Set up scroll hint fade out and wheel scrolling
    setTimeout(() => {
        const gallery = document.getElementById('image-grid');
        const scrollHint = document.getElementById('scroll-hint');
        const viewerContainer = document.querySelector('.viewer-container');
        
        if (gallery && scrollHint) {
            gallery.addEventListener('scroll', () => {
                if (gallery.scrollLeft > 50) {
                    scrollHint.classList.add('hidden');
                }
            }, { once: true });
        }
        
        // Convert vertical scroll wheel to horizontal scrolling
        // Attach to the entire viewer container to catch all wheel events
        if (viewerContainer && gallery) {
            viewerContainer.addEventListener('wheel', (e) => {
                // Only intercept if not already scrolling horizontally
                if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
                    // Prevent default vertical scroll
                    e.preventDefault();
                    
                    // Scroll horizontally based on vertical wheel delta
                    gallery.scrollLeft += e.deltaY;
                }
            }, { passive: false });
            
            console.log('Horizontal wheel scroll enabled');
        }
    }, 100);
}

function renderImages(shelfId, manifest, annotations) {
    if (!manifest.images || manifest.images.length === 0) {
        return `
            <div class="viewer-empty">
                <h3>No Images</h3>
                <p>This shelf doesn't have any images yet.</p>
            </div>
        `;
    }
    
    return manifest.images.map((imagePath, index) => {
        const imageUrl = `shelves/${shelfId}/${imagePath}`;
        const imageRegions = annotations?.regions?.filter(r => r.imageIndex === index) || [];
        
        return `
            <div class="image-wrapper" data-image-index="${index}">
                <img src="${imageUrl}" 
                     alt="Shelf image ${index + 1}" 
                     onload="handleImageLoad(this)"
                     class="image-loading">
                ${imageRegions.length > 0 ? renderAnnotationOverlay(imageRegions, index) : ''}
            </div>
        `;
    }).join('');
}

function renderAnnotationOverlay(regions, imageIndex) {
    const svgRegions = regions.map((region, idx) => {
        const regionId = `region-${imageIndex}-${idx}`;
        return `
            <rect 
                id="${regionId}"
                class="annotation-region"
                x="${region.x}" 
                y="${region.y}" 
                width="${region.width}" 
                height="${region.height}"
                data-label="${escapeHtml(region.label)}"
                data-description="${escapeHtml(region.description || '')}"
            />
        `;
    }).join('');
    
    // SVG will use the natural image dimensions as viewBox
    // We'll set this dynamically when image loads
    return `
        <div class="annotation-overlay">
            <svg class="annotation-svg" preserveAspectRatio="xMinYMin slice">
                ${svgRegions}
            </svg>
        </div>
    `;
}

function createTooltip() {
    // Set up subtitle-style display instead of floating tooltip
    document.addEventListener('mouseover', handleRegionHover);
    document.addEventListener('mouseout', handleRegionLeave);
    
    return null; // No longer using floating tooltip
}

function handleRegionHover(e) {
    if (!e.target.classList.contains('annotation-region')) return;
    
    const label = e.target.dataset.label;
    const description = e.target.dataset.description;
    
    showSubtitle(label, description);
}

function handleRegionLeave(e) {
    if (!e.target.classList.contains('annotation-region')) return;
    
    hideSubtitle();
}

function showSubtitle(label, description) {
    const subtitle = document.getElementById('annotation-subtitle');
    const labelEl = document.getElementById('subtitle-label');
    const descriptionEl = document.getElementById('subtitle-description');
    
    if (subtitle && labelEl && descriptionEl) {
        labelEl.textContent = label;
        descriptionEl.textContent = description || '';
        subtitle.classList.add('visible');
    }
}

function hideSubtitle() {
    const subtitle = document.getElementById('annotation-subtitle');
    if (subtitle) {
        subtitle.classList.remove('visible');
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make handleImageLoad available globally for inline onload
window.handleImageLoad = function(img) {
    img.classList.remove('image-loading');
    
    // Set SVG viewBox to match image natural dimensions
    const wrapper = img.closest('.image-wrapper');
    const svg = wrapper?.querySelector('.annotation-svg');
    
    if (svg && img.naturalWidth && img.naturalHeight) {
        svg.setAttribute('viewBox', `0 0 ${img.naturalWidth} ${img.naturalHeight}`);
        
        // Also set explicit width and height to match displayed image size
        // This ensures the SVG overlay exactly matches the rendered image
        const displayWidth = img.clientWidth;
        const displayHeight = img.clientHeight;
        svg.setAttribute('width', displayWidth);
        svg.setAttribute('height', displayHeight);
        
        console.log(`Set SVG viewBox: 0 0 ${img.naturalWidth} ${img.naturalHeight}`);
        console.log(`Set SVG display size: ${displayWidth} x ${displayHeight}`);
    }
};
