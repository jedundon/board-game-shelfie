// Editor component - create and edit annotation regions
import { loadShelfManifest, loadAnnotations } from '../utils/dataLoader.js';
import { setState, getState } from '../state.js';

let isDrawing = false;
let drawingRegion = null;
let currentImageIndex = null;

// Migration function: Convert old format to new shapes + regions model
function migrateToNewFormat(oldAnnotations) {
    const shapes = [];
    const regions = [];
    
    if (!oldAnnotations || !oldAnnotations.regions) {
        return { shapes, regions };
    }
    
    oldAnnotations.regions.forEach((oldRegion, regionIndex) => {
        // Create new region (metadata only)
        const regionId = `region-${Date.now()}-${regionIndex}`;
        const newRegion = {
            id: regionId,
            label: oldRegion.label || '',
            description: oldRegion.description || '',
            games: oldRegion.games || []
        };
        regions.push(newRegion);
        
        // Extract shapes from old region
        if (oldRegion.shapes && Array.isArray(oldRegion.shapes)) {
            // New format: region had shapes array
            oldRegion.shapes.forEach((shape, shapeIndex) => {
                shapes.push({
                    id: `shape-${Date.now()}-${regionIndex}-${shapeIndex}`,
                    imageIndex: oldRegion.imageIndex,
                    x: shape.x,
                    y: shape.y,
                    width: shape.width,
                    height: shape.height,
                    regionId: regionId
                });
            });
        } else if (oldRegion.x !== undefined && oldRegion.y !== undefined) {
            // Old format: region had direct x/y/width/height
            shapes.push({
                id: `shape-${Date.now()}-${regionIndex}-0`,
                imageIndex: oldRegion.imageIndex,
                x: oldRegion.x,
                y: oldRegion.y,
                width: oldRegion.width,
                height: oldRegion.height,
                regionId: regionId
            });
        }
    });
    
    console.log(`Migrated ${regions.length} regions and ${shapes.length} shapes`);
    return { shapes, regions };
}

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
        let shapes = [];
        let regions = [];
        if (annotationId) {
            try {
                const annotations = await loadAnnotations(shelfId, annotationId);
                const migrated = migrateToNewFormat(annotations);
                shapes = migrated.shapes;
                regions = migrated.regions;
            } catch (error) {
                console.warn(`Could not load annotation ${annotationId}:`, error);
            }
        }
        
        setState({ 
            currentShelf: manifest,
            currentAnnotationId: annotationId,
            editingShapes: shapes,
            editingRegions: regions
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
                    ${renderTabbedPanels(shelfId)}
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
                <div class="editor-image-label">Shelf ${index + 1}</div>
                <img src="${imageUrl}" alt="Shelf ${index + 1}" draggable="false">
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
                    <li><strong>Draw:</strong> Click and drag to create shapes</li>
                    <li><strong>Select:</strong> Click a shape or region to select it</li>
                    <li><strong>Assign:</strong> Link shapes to regions to add labels</li>
                    <li><strong>Export:</strong> Save your annotations when done</li>
                </ul>
            </div>
        </div>
    `;
}

function renderTabbedPanels(shelfId) {
    return `
        <div class="editor-panel">
            <div class="tab-container">
                <div class="tab-buttons">
                    <button class="tab-button active" onclick="switchTab('shapes')">
                        Shapes <span id="shape-count-tab">(0)</span>
                    </button>
                    <button class="tab-button" onclick="switchTab('regions')">
                        Regions <span id="region-count-tab">(0)</span>
                    </button>
                    <button class="tab-button" onclick="switchTab('editor')">
                        Editor
                    </button>
                </div>
                
                <div class="tab-content">
                    <div id="tab-shapes" class="tab-panel active">
                        <div id="shape-list"></div>
                    </div>
                    
                    <div id="tab-regions" class="tab-panel">
                        <div id="region-list"></div>
                        <button onclick="createNewRegion()" class="btn btn-primary" style="width: 100%; margin-top: var(--spacing-md);">
                            + Create Region
                        </button>
                    </div>
                    
                    <div id="tab-editor" class="tab-panel">
                        <div id="editor-form">
                            <div class="editor-empty">
                                Select a shape or region to edit
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        ${renderExportPanel(shelfId)}
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
    
    // Render any existing shapes and regions that were loaded
    const state = getState();
    if (state.editingShapes && state.editingShapes.length > 0) {
        updateAllShapes();
    }
    if (state.editingRegions && state.editingRegions.length > 0) {
        updateRegionList();
    }
}

function handleMouseDown(e, wrapper, imageIndex) {
    // Check if clicking on an existing shape
    if (e.target.classList.contains('editor-shape')) {
        selectShape(e.target.dataset.shapeId);
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
    
    // Create new unassigned shape
    const shapeId = `shape-${Date.now()}`;
    const newShape = {
        id: shapeId,
        imageIndex,
        x: Math.round(x),
        y: Math.round(y),
        width: Math.round(width),
        height: Math.round(height),
        regionId: null  // Unassigned
    };
    
    state.editingShapes = state.editingShapes || [];
    state.editingShapes.push(newShape);
    setState({ editingShapes: state.editingShapes });
    
    drawingRegion = null;
    updateAllShapes();
    selectShape(shapeId);
}

function handleMouseLeave() {
    if (isDrawing) {
        isDrawing = false;
        drawingRegion = null;
        updateAllShapes();
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

function updateAllShapes() {
    const wrappers = document.querySelectorAll('.editor-image-wrapper');
    const state = getState();
    
    wrappers.forEach(wrapper => {
        const svg = wrapper.querySelector('.editor-svg');
        const imageIndex = parseInt(wrapper.dataset.imageIndex);
        
        const shapesHtml = (state.editingShapes || [])
            .filter(s => s.imageIndex === imageIndex)
            .map(s => createShapeElement(s))
            .join('');
        
        svg.innerHTML = shapesHtml;
    });
    
    updateShapeList();
    updateRegionList();
}

function createShapeElement(shape) {
    const state = getState();
    const isSelected = state.selectedShapeId === shape.id;
    const isAssigned = shape.regionId !== null;
    
    // Highlight if this shape belongs to the selected region
    const belongsToSelectedRegion = state.selectedRegionId && shape.regionId === state.selectedRegionId;
    
    // Get region for color coding if assigned
    const region = isAssigned ? state.editingRegions?.find(r => r.id === shape.regionId) : null;
    
    return `
        <rect 
            class="editor-shape ${isSelected ? 'selected' : ''} ${isAssigned ? 'assigned' : 'unassigned'} ${belongsToSelectedRegion ? 'region-highlighted' : ''}"
            data-shape-id="${shape.id}"
            data-region-id="${shape.regionId || ''}"
            x="${shape.x}" 
            y="${shape.y}" 
            width="${shape.width}" 
            height="${shape.height}"
        />
    `;
}

function selectShape(shapeId) {
    const state = getState();
    const shape = (state.editingShapes || []).find(s => s.id === shapeId);
    
    if (!shape) return;
    
    setState({ selectedShapeId: shapeId, selectedRegionId: null });
    updateAllShapes();
    renderShapeEditor(shape);
    
    // Auto-switch to Editor tab
    if (typeof window.switchTab === 'function') {
        window.switchTab('editor');
    }
}

function selectRegion(regionId) {
    const state = getState();
    const region = (state.editingRegions || []).find(r => r.id === regionId);
    
    if (!region) return;
    
    setState({ selectedRegionId: regionId, selectedShapeId: null });
    
    // Update UI
    updateAllShapes();
    renderRegionEditor(region);
    
    // Auto-switch to Editor tab
    if (typeof window.switchTab === 'function') {
        window.switchTab('editor');
    }
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

function updateShapeList() {
    const list = document.getElementById('shape-list');
    const countEl = document.getElementById('shape-count-tab');
    const state = getState();
    const shapes = state.editingShapes || [];
    
    if (countEl) {
        countEl.textContent = `(${shapes.length})`;
    }
    
    if (shapes.length === 0) {
        list.innerHTML = '<div class="list-empty">No shapes drawn yet. Click and drag on an image to draw.</div>';
        return;
    }
    
    // Group shapes by assignment
    const unassigned = shapes.filter(s => !s.regionId);
    const assigned = shapes.filter(s => s.regionId);
    
    // Group assigned shapes by region
    const byRegion = {};
    assigned.forEach(shape => {
        if (!byRegion[shape.regionId]) {
            byRegion[shape.regionId] = [];
        }
        byRegion[shape.regionId].push(shape);
    });
    
    let html = '';
    
    // Unassigned shapes
    if (unassigned.length > 0) {
        html += `<div class="shape-group">
            <div class="shape-group-header unassigned">Unassigned (${unassigned.length})</div>
            ${unassigned.map(shape => createShapeListItem(shape)).join('')}
        </div>`;
    }
    
    // Assigned shapes grouped by region
    Object.keys(byRegion).forEach(regionId => {
        const region = state.editingRegions?.find(r => r.id === regionId);
        const regionShapes = byRegion[regionId];
        const regionLabel = region ? region.label || 'Unnamed Region' : 'Unknown Region';
        
        html += `<div class="shape-group">
            <div class="shape-group-header assigned">${regionLabel} (${regionShapes.length})</div>
            ${regionShapes.map(shape => createShapeListItem(shape)).join('')}
        </div>`;
    });
    
    list.innerHTML = html;
}

function createShapeListItem(shape) {
    const state = getState();
    const isSelected = state.selectedShapeId === shape.id;
    const isAssigned = shape.regionId !== null;
    
    return `
        <div class="shape-item ${isSelected ? 'selected' : ''} ${isAssigned ? 'assigned' : 'unassigned'}" 
             onclick="selectShape('${shape.id}')">
            <div class="shape-item-content">
                <div class="shape-item-label">
                    Shape on Shelf ${shape.imageIndex + 1}
                </div>
                <div class="shape-item-meta">
                    ${shape.width} × ${shape.height}
                </div>
            </div>
            ${!isAssigned ? `
                <select onclick="event.stopPropagation();" 
                        onchange="assignShapeToRegion('${shape.id}', this.value); this.value='';"
                        class="shape-assign-dropdown"
                        title="Assign to region">
                    <option value="">Assign →</option>
                    ${(state.editingRegions || []).map(r => 
                        `<option value="${r.id}">${r.label || 'Unnamed Region'}</option>`
                    ).join('')}
                </select>
            ` : `
                <button onclick="event.stopPropagation(); unassignShape('${shape.id}')" 
                        class="btn-icon" title="Unassign from region">
                    ×
                </button>
            `}
        </div>
    `;
}

function updateRegionList() {
    const list = document.getElementById('region-list');
    const countEl = document.getElementById('region-count-tab');
    const state = getState();
    const regions = state.editingRegions || [];
    
    if (countEl) {
        countEl.textContent = `(${regions.length})`;
    }
    
    if (regions.length === 0) {
        list.innerHTML = '<div class="list-empty">No regions created yet. Click + Create Region.</div>';
        return;
    }
    
    const items = regions.map((region, index) => {
        const isSelected = state.selectedRegionId === region.id;
        const shapeCount = (state.editingShapes || []).filter(s => s.regionId === region.id).length;
        const isEmpty = shapeCount === 0;
        
        return `
            <div class="region-item ${isSelected ? 'selected' : ''} ${isEmpty ? 'empty' : ''}" 
                 onclick="selectRegion('${region.id}')">
                <div class="region-item-icon">${isEmpty ? '○' : '●'}</div>
                <div class="region-item-content">
                    <div class="region-item-label">
                        ${region.label || '<em>Unnamed Region</em>'}
                    </div>
                    <div class="region-item-meta">
                        ${shapeCount} shape${shapeCount !== 1 ? 's' : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    list.innerHTML = items;
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
    const regions = state.editingRegions || [];
    const shapes = state.editingShapes || [];
    
    if (regions.length === 0) {
        alert('No regions to export!');
        return;
    }
    
    // Validate all regions have labels
    const missingLabels = regions.filter(r => !r.label || r.label.trim() === '');
    if (missingLabels.length > 0) {
        alert('All regions must have labels before exporting!');
        return;
    }
    
    // Convert to old format for viewer compatibility
    const exportRegions = regions.map(region => {
        const regionShapes = shapes.filter(s => s.regionId === region.id);
        
        // Get the first shape's imageIndex (all shapes for a region should be on same image ideally)
        const imageIndex = regionShapes.length > 0 ? regionShapes[0].imageIndex : 0;
        
        if (regionShapes.length === 0) {
            // Region with no shapes - skip it
            return null;
        } else if (regionShapes.length === 1) {
            // Single shape - use old format (direct x/y/width/height)
            const shape = regionShapes[0];
            return {
                imageIndex,
                x: shape.x,
                y: shape.y,
                width: shape.width,
                height: shape.height,
                label: region.label,
                description: region.description || '',
                games: region.games || []
            };
        } else {
            // Multiple shapes - use shapes array format
            return {
                imageIndex,
                shapes: regionShapes.map(s => ({
                    x: s.x,
                    y: s.y,
                    width: s.width,
                    height: s.height
                })),
                label: region.label,
                description: region.description || '',
                games: region.games || []
            };
        }
    }).filter(r => r !== null);  // Remove regions with no shapes
    
    if (exportRegions.length === 0) {
        alert('No regions with shapes to export! Assign shapes to your regions first.');
        return;
    }
    
    // Create annotation JSON
    const annotations = {
        version: '1.0',
        created: new Date().toISOString(),
        regions: exportRegions
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
    
    alert(`Exported ${exportRegions.length} region(s)! Upload this file to your shelf's annotations folder.`);
};

// Shape Editor
function renderShapeEditor(shape) {
    const form = document.getElementById('editor-form');
    const state = getState();
    const region = shape.regionId ? state.editingRegions?.find(r => r.id === shape.regionId) : null;
    const regions = state.editingRegions || [];
    
    let html = `
        <div class="shape-editor">
            <h4>Shape on Shelf ${shape.imageIndex + 1}</h4>
            <div class="form-group">
                <label>Size:</label>
                <p>${shape.width} × ${shape.height}</p>
            </div>
            <div class="form-group">
                <label>Assignment:</label>
                ${region ? `
                    <p>Assigned to <strong>${region.label || 'Unnamed Region'}</strong></p>
                    <button onclick="unassignShape('${shape.id}')" class="btn btn-secondary" style="width: 100%;">
                        Unassign from Region
                    </button>
                ` : regions.length > 0 ? `
                    <select onchange="assignShapeToRegion('${shape.id}', this.value)" 
                            style="width: 100%; margin-bottom: var(--spacing-sm);">
                        <option value="">Select a region...</option>
                        ${regions.map(r => 
                            `<option value="${r.id}">${r.label || 'Unnamed Region'}</option>`
                        ).join('')}
                    </select>
                ` : `
                    <p>No regions available. Create a region first.</p>
                    <button onclick="createNewRegion()" class="btn btn-primary" style="width: 100%;">
                        + Create Region
                    </button>
                `}
            </div>
            <div class="form-group">
                <button onclick="deleteShape('${shape.id}')" class="btn btn-danger" style="width: 100%;">
                    Delete Shape
                </button>
            </div>
        </div>
    `;
    
    // If assigned to a region, show the region editor inline below
    if (region) {
        const shapes = (state.editingShapes || []).filter(s => s.regionId === region.id);
        const gamesText = region.games ? region.games.join('\n') : '';
        
        html += `
            <hr style="margin: var(--spacing-lg) 0; border: none; border-top: 2px solid var(--color-border);">
            <div class="region-editor">
                <h4>Edit Region: ${region.label || 'Unnamed Region'}</h4>
                <div class="form-group">
                    <label for="region-label">Label *</label>
                    <input 
                        type="text" 
                        id="region-label" 
                        value="${region.label || ''}" 
                        onchange="updateRegionField('label', this.value)"
                        placeholder="e.g., Horror Games">
                </div>
                <div class="form-group">
                    <label for="region-description">Description</label>
                    <textarea 
                        id="region-description" 
                        onchange="updateRegionField('description', this.value)"
                        placeholder="Optional description"
                        rows="3">${region.description || ''}</textarea>
                </div>
                <div class="form-group">
                    <label for="region-games">Games (one per line)</label>
                    <textarea 
                        id="region-games" 
                        onchange="updateRegionGames(this.value)"
                        placeholder="Enter game names"
                        rows="5">${gamesText}</textarea>
                </div>
                <div class="form-group">
                    <label>Shapes: ${shapes.length}</label>
                    ${shapes.length > 1 ? `
                        <div class="shape-mini-list">
                            ${shapes.map(s => `
                                <div class="shape-mini-item">
                                    Shelf ${s.imageIndex + 1} (${s.width}×${s.height})
                                    <button onclick="event.stopPropagation(); unassignShape('${s.id}')" 
                                            class="btn-icon" title="Unassign">×</button>
                                </div>
                            `).join('')}
                        </div>
                    ` : '<p class="text-muted">This is the only shape in this region</p>'}
                </div>
                <div class="form-group">
                    <button onclick="linkShapeToRegion('${region.id}')" class="btn btn-secondary" style="width: 100%;">
                        + Link Another Shape
                    </button>
                </div>
                <div class="form-group">
                    <button onclick="viewAllRegionShapes('${region.id}')" class="btn btn-secondary" style="width: 100%;">
                        👁 View All Shapes
                    </button>
                </div>
                <div class="form-group">
                    <button onclick="deleteRegion('${region.id}')" class="btn btn-danger" style="width: 100%;">
                        Delete Region
                    </button>
                </div>
            </div>
        `;
    }
    
    form.innerHTML = html;
}

// Region Editor
function renderRegionEditor(region) {
    const form = document.getElementById('editor-form');
    const state = getState();
    const shapes = (state.editingShapes || []).filter(s => s.regionId === region.id);
    const gamesText = region.games ? region.games.join('\n') : '';
    
    form.innerHTML = `
        <div class="region-editor">
            <h4>Edit Region</h4>
            <div class="form-group">
                <label for="region-label">Label *</label>
                <input 
                    type="text" 
                    id="region-label" 
                    value="${region.label || ''}" 
                    onchange="updateRegionField('label', this.value)"
                    placeholder="e.g., Horror Games">
            </div>
            <div class="form-group">
                <label for="region-description">Description</label>
                <textarea 
                    id="region-description" 
                    onchange="updateRegionField('description', this.value)"
                    placeholder="Optional description"
                    rows="3">${region.description || ''}</textarea>
            </div>
            <div class="form-group">
                <label for="region-games">Games (one per line)</label>
                <textarea 
                    id="region-games" 
                    onchange="updateRegionGames(this.value)"
                    placeholder="Enter game names"
                    rows="5">${gamesText}</textarea>
            </div>
            <div class="form-group">
                <label>Shapes: ${shapes.length}</label>
                ${shapes.length > 0 ? `
                    <div class="shape-mini-list">
                        ${shapes.map(s => `
                            <div class="shape-mini-item">
                                Shelf ${s.imageIndex + 1} (${s.width}×${s.height})
                                <button onclick="event.stopPropagation(); unassignShape('${s.id}')" 
                                        class="btn-icon" title="Unassign">×</button>
                            </div>
                        `).join('')}
                    </div>
                ` : '<p class="text-muted">No shapes assigned</p>'}
            </div>
            <div class="form-group">
                <button onclick="linkShapeToRegion('${region.id}')" class="btn btn-secondary" style="width: 100%;">
                    + Link Existing Shape
                </button>
            </div>
            <div class="form-group">
                <button onclick="deleteRegion('${region.id}')" class="btn btn-danger" style="width: 100%;">
                    Delete Region
                </button>
            </div>
        </div>
    `;
}

// Tab switching
window.switchTab = function(tabName) {
    // Update buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.tab-button[onclick="switchTab('${tabName}')"]`)?.classList.add('active');
    
    // Update panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    document.getElementById(`tab-${tabName}`)?.classList.add('active');
};

// Global functions for inline event handlers
window.selectShape = selectShape;
window.selectRegion = selectRegion;

window.createNewRegion = function() {
    const state = getState();
    const regionId = `region-${Date.now()}`;
    const newRegion = {
        id: regionId,
        label: '',
        description: '',
        games: []
    };
    
    state.editingRegions = state.editingRegions || [];
    state.editingRegions.push(newRegion);
    setState({ editingRegions: state.editingRegions });
    
    updateRegionList();
    selectRegion(regionId);
};

window.assignShapeToRegion = function(shapeId, regionId) {
    if (!regionId) return;
    
    const state = getState();
    const shape = state.editingShapes?.find(s => s.id === shapeId);
    
    if (shape) {
        shape.regionId = regionId;
        setState({ editingShapes: state.editingShapes });
        updateAllShapes();
        updateShapeList();
        updateRegionList();
        if (state.selectedShapeId === shapeId) {
            renderShapeEditor(shape);
        }
    }
};

window.unassignShape = function(shapeId) {
    const state = getState();
    const shape = state.editingShapes?.find(s => s.id === shapeId);
    
    if (shape) {
        shape.regionId = null;
        setState({ editingShapes: state.editingShapes });
        updateAllShapes();
        updateShapeList();
        updateRegionList();
        if (state.selectedShapeId === shapeId) {
            renderShapeEditor(shape);
        }
    }
};

window.deleteShape = function(shapeId) {
    if (!confirm('Delete this shape?')) return;
    
    const state = getState();
    state.editingShapes = (state.editingShapes || []).filter(s => s.id !== shapeId);
    
    setState({ 
        editingShapes: state.editingShapes,
        selectedShapeId: null
    });
    
    updateAllShapes();
    updateShapeList();
    updateRegionList();
    document.getElementById('editor-form').innerHTML = '<div class="editor-empty">Select a shape or region to edit</div>';
};

window.deleteRegion = function(regionId) {
    const state = getState();
    const shapesInRegion = (state.editingShapes || []).filter(s => s.regionId === regionId);
    
    let confirmed = false;
    if (shapesInRegion.length > 0) {
        const choice = confirm(`This region has ${shapesInRegion.length} shape(s).\n\nOK = Delete region only (shapes become unassigned)\nCancel = Don't delete`);
        if (choice) {
            // Unassign shapes
            shapesInRegion.forEach(s => s.regionId = null);
            confirmed = true;
        }
    } else {
        confirmed = confirm('Delete this region?');
    }
    
    if (confirmed) {
        state.editingRegions = (state.editingRegions || []).filter(r => r.id !== regionId);
        setState({ 
            editingRegions: state.editingRegions,
            editingShapes: state.editingShapes,
            selectedRegionId: null
        });
        
        updateAllShapes();
        updateShapeList();
        updateRegionList();
        document.getElementById('editor-form').innerHTML = '<div class="editor-empty">Select a shape or region to edit</div>';
    }
};

window.linkShapeToRegion = function(regionId) {
    const state = getState();
    const unassignedShapes = (state.editingShapes || []).filter(s => !s.regionId);
    
    if (unassignedShapes.length === 0) {
        alert('No unassigned shapes available. Draw some shapes first, or unassign existing shapes.');
        return;
    }
    
    // Create a temporary dropdown dialog
    const shapeOptions = unassignedShapes.map(s => 
        `<option value="${s.id}">Shelf ${s.imageIndex + 1} - ${s.width}×${s.height}</option>`
    ).join('');
    
    const dialog = document.createElement('div');
    dialog.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 10000;';
    dialog.innerHTML = `
        <h3 style="margin-top: 0;">Link Shape to Region</h3>
        <select id="shape-link-select" style="width: 100%; padding: 8px; margin: 10px 0;">
            <option value="">Select a shape...</option>
            ${shapeOptions}
        </select>
        <div style="display: flex; gap: 10px; margin-top: 15px;">
            <button id="shape-link-ok" class="btn btn-primary" style="flex: 1;">Link</button>
            <button id="shape-link-cancel" class="btn btn-secondary" style="flex: 1;">Cancel</button>
        </div>
    `;
    
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 9999;';
    
    document.body.appendChild(overlay);
    document.body.appendChild(dialog);
    
    const cleanup = () => {
        document.body.removeChild(overlay);
        document.body.removeChild(dialog);
    };
    
    dialog.querySelector('#shape-link-ok').onclick = () => {
        const shapeId = dialog.querySelector('#shape-link-select').value;
        if (shapeId) {
            const shape = unassignedShapes.find(s => s.id === shapeId);
            if (shape) {
                shape.regionId = regionId;
                setState({ editingShapes: state.editingShapes });
                updateAllShapes();
                updateShapeList();
                updateRegionList();
                selectRegion(regionId);
            }
        }
        cleanup();
    };
    
    dialog.querySelector('#shape-link-cancel').onclick = cleanup;
    overlay.onclick = cleanup;
};

window.updateRegionField = function(field, value) {
    const state = getState();
    const region = state.editingRegions?.find(r => r.id === state.selectedRegionId);
    if (region) {
        region[field] = value;
        updateRegionList();
    }
};

window.updateRegionGames = function(value) {
    const state = getState();
    const region = state.editingRegions?.find(r => r.id === state.selectedRegionId);
    if (region) {
        region.games = value
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
    }
};

window.viewAllRegionShapes = function(regionId) {
    // Select the region to highlight all its shapes
    selectRegion(regionId);
    
    // Scroll to the first shape's image if possible
    const state = getState();
    const shapes = (state.editingShapes || []).filter(s => s.regionId === regionId);
    if (shapes.length > 0) {
        const firstShape = shapes[0];
        const wrapper = document.querySelector(`.editor-image-wrapper[data-image-index="${firstShape.imageIndex}"]`);
        if (wrapper) {
            wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
};
