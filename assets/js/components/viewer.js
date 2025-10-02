// Placeholder for viewer component
export async function renderViewer(shelfId, annotationId) {
    const main = document.getElementById('main');
    main.innerHTML = `
        <div class="container">
            <h2>Viewer</h2>
            <div class="message message-info">
                <p>Viewer component will be implemented next!</p>
                <p>Shelf ID: ${shelfId}</p>
                ${annotationId ? `<p>Annotation ID: ${annotationId}</p>` : ''}
            </div>
        </div>
    `;
}
