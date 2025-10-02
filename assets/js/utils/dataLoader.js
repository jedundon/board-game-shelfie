// Data loading utilities

const cache = new Map();

export async function loadShelfIndex() {
    if (cache.has('index')) {
        return cache.get('index');
    }
    
    try {
        const response = await fetch('shelves/index.json');
        if (!response.ok) {
            throw new Error(`Failed to load shelf index: ${response.status}`);
        }
        const data = await response.json();
        cache.set('index', data);
        return data;
    } catch (error) {
        console.error('Error loading shelf index:', error);
        throw error;
    }
}

export async function loadShelfManifest(shelfId) {
    const cacheKey = `manifest-${shelfId}`;
    if (cache.has(cacheKey)) {
        return cache.get(cacheKey);
    }
    
    try {
        const response = await fetch(`shelves/${shelfId}/manifest.json`);
        if (!response.ok) {
            throw new Error(`Failed to load manifest for ${shelfId}: ${response.status}`);
        }
        const data = await response.json();
        cache.set(cacheKey, data);
        return data;
    } catch (error) {
        console.error(`Error loading manifest for ${shelfId}:`, error);
        throw error;
    }
}

export async function loadAnnotations(shelfId, annotationId) {
    const cacheKey = `annotations-${shelfId}-${annotationId}`;
    if (cache.has(cacheKey)) {
        return cache.get(cacheKey);
    }
    
    try {
        const manifest = await loadShelfManifest(shelfId);
        const annotation = manifest.annotations.find(a => a.id === annotationId);
        
        if (!annotation) {
            throw new Error(`Annotation ${annotationId} not found in manifest`);
        }
        
        const response = await fetch(`shelves/${shelfId}/${annotation.file}`);
        if (!response.ok) {
            throw new Error(`Failed to load annotations: ${response.status}`);
        }
        const data = await response.json();
        cache.set(cacheKey, data);
        return data;
    } catch (error) {
        console.error(`Error loading annotations for ${shelfId}/${annotationId}:`, error);
        throw error;
    }
}

export function clearCache() {
    cache.clear();
}
