
class Supplier extends Model{
    /**
     *
     * @param {int|null} id
     * @param {string} name
     */
    constructor(id, name) {
        super(id);
        this.name = name;
    }

    static get uri() {
        return  Setting.supplierURI;
    }

    /**
     *
     * @param object
     * @private
     * @returns Supplier
     */
    static _responseToObject(object) {
        return new Supplier(
            object.id,
            object.name
        )
    }

    /**
     *
     * @returns {Promise}
     */
    update() {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: Setting.supplierURI+this.id,
                type : 'PATCH',
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                data : this.toCreateResponse(),
                beforeSend : function (request) {
                    request.setRequestHeader("Authorization", "Bearer " + Cookies.get('token'));
                },
            })
                .done(function(data) {
                    resolve(data);
                })
                .fail(function(message) {
                    reject(message);
                })
        });
    }

    /**
     *
     * @returns {{id : int, name: string}}
     */
    toCreateArray() {
        return {
            'id' : this.id,
            'name' : this.name,
        }
    }

    toTable() {
        return this.name;
    }
}