class Setting {
    static get baseURI() {
        return 'http://localhost:9998/';
    }

    static get supplierURI() {
        return this.baseURI+'suppliers/'
    }

    static get userURI() {
        return this.baseURI+'users/'
    }

    static get selfURI() {
        return this.baseURI+'self/'
    }

    static get loginURI() {
        return this.baseURI+'authentication/login/';
    }

    static get weightURI() {
        return this.baseURI+'weights/';
    }

    static get materialURI() {
        return this.baseURI+'materials/';
    }

    static get componentURI() {
        return this.baseURI+'components/'
    }

    static get recipeURI() {
        return this.baseURI+'recipes/'
    }

    static get batchURI() {
        return this.baseURI+'batches/'
    }

    static get weighingURI() {
        return this.baseURI+'weighings/'
    }
}