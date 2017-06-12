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
}