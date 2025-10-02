// Hash-based router

export class Router {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        
        // Listen for hash changes
        window.addEventListener('hashchange', () => this.handleRouteChange());
        
        // Handle initial load
        this.handleRouteChange();
    }
    
    addRoute(pattern, handler) {
        this.routes.set(pattern, handler);
    }
    
    parseHash() {
        const hash = window.location.hash.slice(1) || '/browse';
        const parts = hash.split('/').filter(p => p);
        
        return {
            path: hash,
            parts: parts
        };
    }
    
    async handleRouteChange() {
        const { path, parts } = this.parseHash();
        
        // Default to browse if no route
        if (parts.length === 0) {
            parts.push('browse');
        }
        
        const mode = parts[0];
        const shelfId = parts[1] || null;
        const annotationId = parts[2] || null;
        
        this.currentRoute = {
            mode,
            shelfId,
            annotationId,
            path
        };
        
        // Find and execute matching route handler
        const handler = this.routes.get(mode);
        if (handler) {
            try {
                await handler(this.currentRoute);
            } catch (error) {
                console.error('Route handler error:', error);
                this.handleError(error);
            }
        } else {
            this.handle404();
        }
    }
    
    navigate(path) {
        window.location.hash = path;
    }
    
    handleError(error) {
        const main = document.getElementById('main');
        main.innerHTML = `
            <div class="container">
                <div class="message message-error">
                    <h2>Error</h2>
                    <p>${error.message || 'An unexpected error occurred'}</p>
                    <a href="#/browse" class="btn">Back to Browse</a>
                </div>
            </div>
        `;
    }
    
    handle404() {
        const main = document.getElementById('main');
        main.innerHTML = `
            <div class="container">
                <div class="message message-error">
                    <h2>404 - Page Not Found</h2>
                    <p>The page you're looking for doesn't exist.</p>
                    <a href="#/browse" class="btn">Back to Browse</a>
                </div>
            </div>
        `;
    }
}
