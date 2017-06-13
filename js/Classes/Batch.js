class Batch extends Model{
    /**
     *
     * @param {int} id
     * @param {string} status
     * @param {Recipe} recipe
     */
    constructor(id, status, recipe) {
        super(id);
        this.status = status;
        this.recipe = recipe;
    }

    static get uri() {
        return  Setting.batchURI;
    }

    get uri() {
        return  Setting.batchURI;
    }

    /**
     *
     * @param object
     * @private
     * @returns Batch
     */
    static _responseToObject(object) {
        return new Batch(
            object.id,
            object.status,
            new Recipe(object.recipe.id, object.recipe.name)
        )
    }

    toArray() {
        return {
            id : this.id,
            recipe : this.recipe.id
        }
    }
}