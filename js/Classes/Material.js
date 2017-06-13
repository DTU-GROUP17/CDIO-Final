/**
 * @property {Supplier} supplier
 * @property {Component} component
 */
class Material extends Model{
    /**
     *
     * @param {int|null} id
     * @param {float} inStock
     * @param {float} stocked
     * @param {Supplier} supplier
     * @param {Component} component
     * @param {string} createdAt
     * @param {string|null} createdBy
     */
    constructor(id, inStock, stocked, supplier, component, createdAt, createdBy) {
        super(id, Setting.materialURI);
        this.inStock = inStock;
        this.stocked = stocked;
        this.supplier = supplier;
        this.component = component;
        this.createdAt = createdAt;
        this.createdBy = createdBy;
    }

    static get uri() {
        return Setting.materialURI;
    }

    get uri() {
        return Setting.materialURI;
    }

    /**
     * @returns {{id: int, supplier: int, component: int, stocked: float}}
     */
    toArray() {
        return {
            'id' : this.id,
            'supplier' : this.supplier.id,
            'component' : this.component.id,
            'stocked' : this.stocked
        }
    }

    /**
     *
     * @param object
     * @private
     * @returns Material
     */
    static _responseToObject(object) {
        return new Material(
            object.id,
            object.inStock,
            object.stocked,
            new Supplier(object.supplier.id, object.supplier.name),
            new Component(object.component.id, object.component.name),
            moment(object.createdAt),
            object.createdBy === null ? null : object.createdBy.id
        )
    }
}