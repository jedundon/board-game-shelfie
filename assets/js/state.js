// State management
export const state = {
    currentMode: null,
    currentShelf: null,
    currentShelfId: null,
    currentAnnotations: null,
    currentAnnotationId: null,
    shelfIndex: null,
    editingRegions: [],
    selectedRegionId: null
};

export function setState(updates) {
    Object.assign(state, updates);
}

export function getState() {
    return state;
}
