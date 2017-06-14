class Component extends Model{
    /**
     *
     * @param {int} id
     * @param {string} name
     */
    constructor(id, name) {
        super(id);
        this.name = name;
    }

    static get uri() {
        return  Setting.componentURI;
    }

    /**
     *
     * @param object
     * @private
     * @returns Component
     */
    static _responseToObject(object) {
        return new Component(
            object.id,
            object.name
        )
    }

    toTable() {
        return this.name;
    }

    toCreateArray() {
        return {
            id : this.id,
            name : this.name
        }
    }
}