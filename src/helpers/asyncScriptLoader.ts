export class AsyncScriptLoader {
    scriptUrl: string;

    constructor(scriptUrl: string) {
        this.scriptUrl = scriptUrl;
    }

    createScriptNode(): HTMLElement {
        const script = document.createElement('script');
        script.src = this.scriptUrl;
        script.async = true;
        return script;
    }

    load(): Promise<void> {
        if (this.getScriptNode()) {
            return Promise.resolve();
        }

        const script = this.createScriptNode();
        if (document.body === null) {
            return new Promise((resolve: () => void) => {
                resolve();
            });
        }

        document.body.appendChild(script);
        return new Promise((resolve: () => void, reject: () => void) => {
            script.onload = function() {
                resolve();
            };

            script.onerror = function() {
                reject();
            };
        });
    }

    getScriptNode(): HTMLElement | null {
        return document.querySelector(`script[src="${this.scriptUrl}"]`);
    }
}
