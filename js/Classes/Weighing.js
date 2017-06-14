class Weighing extends Model{
    constructor(id, amount, material, weight) {
        super(id);
        this.material = material;
        this.weight = weight;
        this.amount = amount;
    }

    static get uri(){
        return Setting.weighingURI;
    }

    toArray() {
        return {
            'id' : this.id
        }
    }

    /**
     *
     * @param {{}} object
     * @private
     * @returns Weighing
     */
    static _responseToObject(object) {
        return new Weighing(
            object.id,
            object.amount,
            Material._responseToObject(object.material),
            Weight._responseToObject(object.weight)
        )
    }
}





