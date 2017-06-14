class Recipe extends Model{
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
        return  Setting.recipeURI;
    }

    /**
     *
     * @param object
     * @private
     * @returns Recipe
     */
    static _responseToObject(object) {
        return new Recipe(
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