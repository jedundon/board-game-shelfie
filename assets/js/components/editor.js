// Editor component - create and edit annotation regions
import { loadShelfManifest, loadAnnotations } from '../utils/dataLoader.js';
import { setState, getState } from '../state.js';

let isDrawing = false;
let drawingRegion = null;
let currentImageIndex = null;

export async function renderEditor(shelfId, annotationId) {
    const main = document.getElementById('main');
    
    // Show loading state
    main.innerHTML = `
        <div class="container">
            <div class="loading">
                <div class="spinner"></div>
                <p>Loading editor...</p>
            </div>
        </div>
    `;
    
    try {
        const manifest = await loadShelfManifest(shelfId);
        
        // Load existing annotation if specified
        let existingRegions = [];
        if (annotationId) {
            try {
                const annotations = await loadAnnotations(shelfId, annotationId);
                existingRegions = annotations.regions || [];
                console.log(`Loaded ${existingRegions.length} existing regions from ${annotationId}`);
            } catch (error) {
                console.warn(`Could not load annotation ${annotationId}:`, error);
            }
        }
        
        setState({ 
            currentShelf: manifest,
            currentAnnotationId: annotationId,
            editingRegions: existingRegions
        });
        
        renderEditorUI(shelfId, manifest, annotationId);
        setupEditorEvents();
        
    } catch (error) {
        main.innerHTML = `
            <div class="container">
                <div class="message message-error">
                    <h2>Error Loading Editor</h2>
                    <p>${error.message}</p>
                    <a href="#/browse" class="btn">Back to Browse</a>
                </div>
            </div>
        `;
    }
}

function renderEditorUI(shelfId, manifest, annotationId) {
    const main = document.getElementById('main');
    
    if (!manifest.images || manifest.images.length === 0) {
        main.innerHTML = `
            <div class="container">
                <div class="message message-error">
                    <h2>No Images</h2>
                    <p>This shelf doesn't have any images to annotate.</p>
                    <a href="#/browse" class="btn">Back to Browse</a>
                </div>
            </div>
        `;
        return;
    }
    
    main.innerHTML = `
        <div class="container editor-container">
            <div style="margin-bottom: var(--spacing-lg);">
                <h2>${manifest.name || shelfId} - Annotation Editor</h2>
                <p class="text-muted">Click and drag on images to create annotation regions</p>
                ${renderAnnotationSelector(shelfId, manifest, annotationId)}
            </div>
            
            <div class="editor-layout">
                <div class="editor-canvas-area">
                    <div class="editor-images" id="editor-images">
                        ${renderEditorImages(shelfId, manifest)}
                    </div>
                </div>
                
                <div class="editor-sidebar">
                    ${renderInstructions()}
                    ${renderRegionEditor()}
                    ${renderRegionList()}
                    ${renderExportPanel(shelfId)}
                </div>
            </div>
        </div>
    `;
}

function renderEditorImages(shelfId, manifest) {
    return manifest.images.map((imagePath, index) => {
        const imageUrl = `shelves/${shelfId}/${imagePath}`;
        return `
            <div class="editor-image-wrapper" data-image-index="${index}">
                <div class="editor-image-label">Image ${index + 1}</div>
                <img src="${imageUrl}" alt="Image ${index + 1}" draggable="false">
                <div class="editor-overlay">
                    <svg class="editor-svg" preserveAspectRatio="xMidYMid meet"></svg>
                </div>
            </div>
        `;
    }).join('');
}

function renderAnnotationSelector(shelfId, manifest, currentAnnotationId) {
    if (!manifest.annotations || manifest.annotations.length === 0) {
        return `
            <div class="annotation-selector" style="margin-top: var(--spacing-md);">
                <p class="text-muted">Creating new annotation set</p>
            </div>
        `;
    }
    
    return `
        <div class="annotation-selector" style="margin-top: var(--spacing-md);">
            <label for="edit-annotation-select">Edit annotation:</label>
            <select id="edit-annotation-select" onchange="window.location.hash = '#/annotate/${shelfId}/' + (this.value === '_new_' ? '' : this.value)">
                <option value="_new_" ${!currentAnnotationId ? 'selected' : ''}>New Annotation</option>
                ${manifest.annotations.map(a => `
                    <option value="${a.id}" ${a.id === currentAnnotationId ? 'selected' : ''}>
                        ${a.name} by ${a.author}
                    </option>
                `).join('')}
            </select>
        </div>
    `;
}

function renderInstructions() {
    return `
        <div class="editor-panel">
            <h3>Instructions</h3>
            <div class="editor-instructions">
                <ul>
                    <li>Click and drag on an image to create a region</li>
                    <li>Click a region to select and edit it</li>
                    <li>Fill in the label and description</li>
                    <li>Click Export when done</li>
                </ul>
            </div>
        </div>
    `;
}

function renderRegionEditor() {
    return `
        <div class="editor-panel">
            <h3>Edit Region</h3>
            <div id="region-editor-form">
                <div class="region-editor-empty">
                    Select a region to edit
                </div>
            </div>
        </div>
    `;
}

function renderRegionList() {
    return `
        <div class="editor-panel">
            <h3>Regions (<span id="region-count">0</span>)</h3>
            <div class="region-list" id="region-list">
                <div class="region-list-empty">
                    No regions created yet
                </div>
            </div>
        </div>
    `;
}

function renderExportPanel(shelfId) {
    return `
        <div class="editor-panel">
            <h3>Export</h3>
            <div class="export-actions">
                <button class="btn" onclick="exportAnnotations()">
                    💾 Download JSON
                </button>
                <button class="btn btn-secondary" onclick="clearAllRegions()">
                    🗑️ Clear All
                </button>
                <a href="#/view/${shelfId}" class="btn btn-outline">
                    👁️ View Mode
                </a>
            </div>
            <div class="export-info">
                Download the JSON file and upload it to your shelf's annotations folder
            </div>
        </div>
    `;
}

function setupEditorEvents() {
    const images = document.querySelectorAll('.editor-image-wrapper');
    
    images.forEach((wrapper, index) => {
        const img = wrapper.querySelector('img');
        const svg = wrapper.querySelector('.editor-svg');
        
        // Set SVG viewBox when image loads
        img.addEventListener('load', () => {
            if (img.naturalWidth && img.naturalHeight) {
                svg.setAttribute('viewBox', `0 0 ${img.naturalWidth} ${img.naturalHeight}`);
            }
        });
        
        // Drawing events
        wrapper.addEventListener('mousedown', (e) => handleMouseDown(e, wrapper, index));
        wrapper.addEventListener('mousemove', (e) => handleMouseMove(e, wrapper));
        wrapper.addEventListener('mouseup', (e) => handleMouseUp(e, wrapper, index));
        wrapper.addEventListener('mouseleave', () => handleMouseLeave());
    });
    
    // Render any existing regions that were loaded
    const state = getState();
    if (state.editingRegions && state.editingRegions.length > 0) {
        updateAllRegions();
        updateRegionList();
        updateRegionCount();
    }
}

function handleMouseDown(e, wrapper, imageIndex) {
    // Only start drawing if clicking directly on the image, not on existing regions
    if (e.target.classList.contains('editor-region')) {
        selectRegion(e.target.dataset.regionId);
        return;
    }
    
    const rect = wrapper.getBoundingClientRect();
    const img = wrapper.querySelector('img');
    
    // Calculate position relative to natural image size
    const scaleX = img.naturalWidth / rect.width;
    const scaleY = img.naturalHeight / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    isDrawing = true;
    currentImageIndex = imageIndex;
    drawingRegion = { x, y, width: 0, height: 0 };
    
    updateDrawingPreview(wrapper);
}

function handleMouseMove(e, wrapper) {
    if (!isDrawing || !drawingRegion) return;
    
    const rect = wrapper.getBoundingClientRect();
    const img = wrapper.querySelector('img');
    
    const scaleX = img.naturalWidth / rect.width;
    const scaleY = img.naturalHeight / rect.height;
    
    const currentX = (e.clientX - rect.left) * scaleX;
    const currentY = (e.clientY - rect.top) * scaleY;
    
    drawingRegion.width = currentX - drawingRegion.x;
    drawingRegion.height = currentY - drawingRegion.y;
    
    updateDrawingPreview(wrapper);
}

function handleMouseUp(e, wrapper, imageIndex) {
    if (!isDrawing || !drawingRegion) return;
    
    isDrawing = false;
    
    // Normalize negative dimensions
    let { x, y, width, height } = drawingRegion;
    if (width < 0) {
        x += width;
        width = Math.abs(width);
    }
    if (height < 0) {
        y += height;
        height = Math.abs(height);
    }
    
    // Minimum size check
    if (width < 10 || height < 10) {
        drawingRegion = null;
        updateDrawingPreview(wrapper);
        addingShapeMode = false;
        return;
    }
    
    const state = getState();
    
    // Check if we're adding a shape to an existing region
    if (addingShapeMode && state.selectedRegionId) {
        const region = state.editingRegions.find(r => r.id === state.selectedRegionId);
        if (region) {
            // Normalize region to shapes array format
            if (!region.shapes) {
                region.shapes = [{
                    type: 'rect',
                    x: region.x,
                    y: region.y,
                    width: region.width,
                    height: region.height
                }];
                delete region.x;
                delete region.y;
                delete region.width;
                delete region.height;
            }
            
            // Add new shape
            region.shapes.push({
                type: 'rect',
                x: Math.round(x),
                y: Math.round(y),
                width: Math.round(width),
                height: Math.round(height)
            });
            
            addingShapeMode = false;
            drawingRegion = null;
            updateAllRegions();
            renderRegionForm(region);
            return;
        }
    }
    
    // Create new region
    const regionId = `region-${Date.now()}`;
    const newRegion = {
        id: regionId,
        imageIndex,
        x: Math.round(x),
        y: Math.round(y),
        width: Math.round(width),
        height: Math.round(height),
        label: '',
        description: ''
    };
    
    state.editingRegions.push(newRegion);
    setState({ editingRegions: state.editingRegions });
    
    addingShapeMode = false;
    drawingRegion = null;
    updateAllRegions();
    selectRegion(regionId);
}

function handleMouseLeave() {
    if (isDrawing) {
        isDrawing = false;
        drawingRegion = null;
        updateAllRegions();
    }
}

function updateDrawingPreview(wrapper) {
    const svg = wrapper.querySelector('.editor-svg');
    const state = getState();
    const imageIndex = parseInt(wrapper.dataset.imageIndex);
    
    // Render existing regions for this image
    const existingRegions = state.editingRegions
        .filter(r => r.imageIndex === imageIndex)
        .map(r => createRegionElement(r))
        .join('');
    
    // Add drawing preview
    let preview = '';
    if (drawingRegion) {
        const { x, y, width, height } = drawingRegion;
        preview = `
            <rect 
                class="editor-region drawing"
                x="${x}" 
                y="${y}" 
                width="${Math.abs(width)}" 
                height="${Math.abs(height)}"
            />
        `;
    }
    
    svg.innerHTML = existingRegions + preview;
}

function updateAllRegions() {
    const wrappers = document.querySelectorAll('.editor-image-wrapper');
    const state = getState();
    
    wrappers.forEach(wrapper => {
        const svg = wrapper.querySelector('.editor-svg');
        const imageIndex = parseInt(wrapper.dataset.imageIndex);
        
        const regions = state.editingRegions
            .filter(r => r.imageIndex === imageIndex)
            .map(r => createRegionElement(r))
            .join('');
        
        svg.innerHTML = regions;
    });
    
    updateRegionList();
    updateRegionCount();
}

function createRegionElement(region) {
    const isSelected = getState().selectedRegionId === region.id;
    
    // Support both old format (x/y/width/height) and new format (shapes array)
    const shapes = region.shapes || [{
        type: 'rect',
        x: region.x,
        y: region.y,
        width: region.width,
        height: region.height
    }];
    
    return shapes.map((shape, index) => `
        <rect 
            class="editor-region ${isSelected ? 'selected' : ''}"
            data-region-id="${region.id}"
            data-shape-index="${index}"
            x="${shape.x}" 
            y="${shape.y}" 
            width="${shape.width}" 
            height="${shape.height}"
        />
    `).join('');
}

function selectRegion(regionId) {
    const state = getState();
    const region = state.editingRegions.find(r => r.id === regionId);
    
    if (!region) return;
    
    setState({ selectedRegionId: regionId });
    
    // Update UI
    updateAllRegions();
    renderRegionForm(region);
}

function renderRegionForm(region) {
    const form = document.getElementById('region-editor-form');
    const gamesText = region.games ? region.games.join('\n') : '';
    
    form.innerHTML = `
        <div class="region-editor">
            <div class="form-group">
                <label for="region-label">Label *</label>
                <input 
                    type="text" 
                    id="region-label" 
                    value="${region.label || ''}"
                    placeholder="e.g., Party Games"
                    maxlength="50"
                    oninput="updateRegionField('label', this.value)"
                >
            </div>
            <div class="form-group">
                <label for="region-description">Description</label>
                <textarea 
                    id="region-description" 
                    rows="3"
                    placeholder="Optional longer description"
                    maxlength="200"
                    oninput="updateRegionField('description', this.value)"
                >${region.description || ''}</textarea>
            </div>
            <div class="form-group">
                <label for="region-games">Games (one per line)</label>
                <textarea 
                    id="region-games" 
                    rows="6"
                    placeholder="List games, one per line&#10;e.g.,&#10;Terraforming Mars&#10;Wingspan&#10;Splendor"
                    oninput="updateRegionGames(this.value)"
                >${gamesText}</textarea>
                <small class="form-help">Enter each game name on a new line</small>
            </div>
            <div class="form-group">
                <label>Shapes (${region.shapes ? region.shapes.length : 1})</label>
                <div class="shape-list" id="shape-list"></div>
                <button class="btn btn-outline" onclick="startAddingShape()">
                    ➕ Add Another Rectangle
                </button>
                <small class="form-help">Add multiple rectangles to cover non-contiguous areas</small>
            </div>
            <button class="btn btn-secondary" onclick="deleteSelectedRegion()">
                🗑️ Delete Region
            </button>
        </div>
    `;
    
    // Render the shapes list after the form
    setTimeout(() => renderShapeList(region), 0);
}

function updateRegionList() {
    const list = document.getElementById('region-list');
    const state = getState();
    
    if (state.editingRegions.length === 0) {
        list.innerHTML = '<div class="region-list-empty">No regions created yet</div>';
        return;
    }
    
    const items = state.editingRegions.map((region, index) => {
        const isSelected = state.selectedRegionId === region.id;
        return `
            <div class="region-item ${isSelected ? 'selected' : ''}" onclick="selectRegion('${region.id}')">
                <div class="region-item-number">${index + 1}</div>
                <div class="region-item-content">
                    <div class="region-item-label">
                        ${region.label || '<em>No label</em>'}
                    </div>
                    <div class="region-item-meta">
                        Image ${region.imageIndex + 1}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    list.innerHTML = items;
}

function updateRegionCount() {
    const count = document.getElementById('region-count');
    if (count) {
        count.textContent = getState().editingRegions.length;
    }
}

// Global functions for inline event handlers
window.updateRegionField = function(field, value) {
    const state = getState();
    const region = state.editingRegions.find(r => r.id === state.selectedRegionId);
    if (region) {
        region[field] = value;
        updateRegionList();
    }
};

window.updateRegionGames = function(value) {
    const state = getState();
    const region = state.editingRegions.find(r => r.id === state.selectedRegionId);
    if (region) {
        // Split by newlines, trim whitespace, filter out empty lines
        region.games = value
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
        updateRegionList();
    }
};

function renderShapeList(region) {
    const shapeListEl = document.getElementById('shape-list');
    if (!shapeListEl) return;
    
    // Normalize to shapes array format
    const shapes = region.shapes || [{
        type: 'rect',
        x: region.x,
        y: region.y,
        width: region.width,
        height: region.height
    }];
    
    if (shapes.length <= 1) {
        shapeListEl.innerHTML = '<small class="text-muted">Single shape</small>';
        return;
    }
    
    const shapeItems = shapes.map((shape, idx) => `
        <div class="shape-item">
            <span>Rectangle ${idx + 1}: ${Math.round(shape.width)}×${Math.round(shape.height)}px</span>
            <button class="btn-icon" onclick="deleteShape(${idx})" title="Delete this shape">×</button>
        </div>
    `).join('');
    
    shapeListEl.innerHTML = shapeItems;
}

let addingShapeMode = false;

window.startAddingShape = function() {
    addingShapeMode = true;
    alert('Click and drag on the image to add another rectangle to this region.');
};

window.deleteShape = function(shapeIndex) {
    const state = getState();
    const region = state.editingRegions.find(r => r.id === state.selectedRegionId);
    if (!region) return;
    
    // Normalize to shapes array
    if (!region.shapes) {
        region.shapes = [{
            type: 'rect',
            x: region.x,
            y: region.y,
            width: region.width,
            height: region.height
        }];
        delete region.x;
        delete region.y;
        delete region.width;
        delete region.height;
    }
    
    if (region.shapes.length <= 1) {
        alert('Cannot delete the last shape. Delete the entire region instead.');
        return;
    }
    
    region.shapes.splice(shapeIndex, 1);
    updateAllRegions();
    renderRegionForm(region);
};

window.deleteSelectedRegion = function() {
    const state = getState();
    if (!state.selectedRegionId) return;
    
    if (!confirm('Delete this region?')) return;
    
    state.editingRegions = state.editingRegions.filter(r => r.id !== state.selectedRegionId);
    setState({ 
        editingRegions: state.editingRegions,
        selectedRegionId: null
    });
    
    updateAllRegions();
    
    const form = document.getElementById('region-editor-form');
    form.innerHTML = '<div class="region-editor-empty">Select a region to edit</div>';
};

window.clearAllRegions = function() {
    if (!confirm('Delete all regions?')) return;
    
    setState({ 
        editingRegions: [],
        selectedRegionId: null
    });
    
    updateAllRegions();
    
    const form = document.getElementById('region-editor-form');
    form.innerHTML = '<div class="region-editor-empty">Select a region to edit</div>';
};

window.exportAnnotations = function() {
    const state = getState();
    
    if (state.editingRegions.length === 0) {
        alert('No regions to export!');
        return;
    }
    
    // Validate all regions have labels
    const missingLabels = state.editingRegions.filter(r => !r.label || r.label.trim() === '');
    if (missingLabels.length > 0) {
        alert('All regions must have labels before exporting!');
        return;
    }
    
    // Create annotation JSON
    const annotations = {
        version: '1.0',
        created: new Date().toISOString(),
        regions: state.editingRegions.map(({ id, ...region }) => region)
    };
    
    // Download file
    const json = JSON.stringify(annotations, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.currentShelfId || 'annotations'}-${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    
    alert('Annotations exported! Upload this file to your shelf\'s annotations folder.');
};

window.selectRegion = selectRegion;
