// Placeholder for editor component
export async function renderEditor(shelfId) {
    const main = document.getElementById('main');
    main.innerHTML = `
        <div class="container">
            <h2>Editor</h2>
            <div class="message message-info">
                <p>Editor component will be implemented next!</p>
                <p>Shelf ID: ${shelfId}</p>
            </div>
        </div>
    `;
}
