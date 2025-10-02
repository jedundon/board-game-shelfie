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
        <div class="container viewer-container">
            <div class="viewer-header">
                <div class="shelf-info">
                    <div>
                        <h2 class="shelf-title">${manifest.name || shelfId}</h2>
                        <p class="shelf-meta">By ${manifest.author || 'Unknown'}</p>
                        ${manifest.description ? `<p class="text-muted">${manifest.description}</p>` : ''}
                    </div>
                    <div>
                        <a href="#/annotate/${shelfId}" class="btn btn-outline">
                            ✏️ Create Annotations
                        </a>
                    </div>
                </div>
                ${annotationSelector}
            </div>
            
            <div class="image-grid" id="image-grid">
                ${renderImages(shelfId, manifest, annotations)}
            </div>
        </div>
    `;
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
            <svg class="annotation-svg" preserveAspectRatio="none">
                ${svgRegions}
            </svg>
        </div>
    `;
}

function createTooltip() {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.id = 'annotation-tooltip';
    document.body.appendChild(tooltip);
    
    // Add event listeners to all annotation regions
    document.addEventListener('mouseover', handleRegionHover);
    document.addEventListener('mouseout', handleRegionLeave);
    document.addEventListener('mousemove', handleMouseMove);
    
    return tooltip;
}

function handleRegionHover(e) {
    if (!e.target.classList.contains('annotation-region')) return;
    
    const label = e.target.dataset.label;
    const description = e.target.dataset.description;
    
    if (tooltip) {
        tooltip.innerHTML = `
            <div class="tooltip-label">${label}</div>
            ${description ? `<div class="tooltip-description">${description}</div>` : ''}
        `;
        tooltip.classList.add('visible');
    }
}

function handleRegionLeave(e) {
    if (!e.target.classList.contains('annotation-region')) return;
    
    if (tooltip) {
        tooltip.classList.remove('visible');
    }
}

function handleMouseMove(e) {
    if (!tooltip || !tooltip.classList.contains('visible')) return;
    
    const padding = 15;
    const tooltipRect = tooltip.getBoundingClientRect();
    
    let x = e.clientX + padding;
    let y = e.clientY + padding;
    
    // Keep tooltip on screen
    if (x + tooltipRect.width > window.innerWidth) {
        x = e.clientX - tooltipRect.width - padding;
    }
    
    if (y + tooltipRect.height > window.innerHeight) {
        y = e.clientY - tooltipRect.height - padding;
    }
    
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
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
        console.log(`Set SVG viewBox: 0 0 ${img.naturalWidth} ${img.naturalHeight}`);
    }
};
