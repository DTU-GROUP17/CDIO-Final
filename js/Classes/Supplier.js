
class Supplier {
    /**
     *
     * @param {int|null} id
     * @param {string} name
     */
    constructor(id, name) {
        this.id = id;
        this.name = name;
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
                data : this.toStringWithoutId(),
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

    create() {
        return new Promise((resolve, reject) => {
            let self = this;
            $.ajax({
                url: Setting.supplierURI,
                type : 'POST',
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                data : this.toStringWithoutId(),
                beforeSend : function (request) {
                    request.setRequestHeader("Authorization", "Bearer " + Cookies.get('token'));
                },
            })
                .done(function(data) {
                    self.id = data.id;
                    resolve(self);
                })
                .fail(function(message) {
                    reject(message);
                })
        });
    }

    static all() {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: Setting.supplierURI,
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                beforeSend : function (request) {
                    request.setRequestHeader("Authorization", "Bearer " + Cookies.get('token'));
                },
            })
                .done(function(data) {
                    let suppliers = [];
                    data.forEach(function (supplier) {
                        suppliers.push(new Supplier(supplier.id, supplier.name));
                    });
                    resolve(suppliers);
                })
                .fail(function () {
                    reject();
                })
        });
    }

    /**
     *
     * @returns {{id : int, name: string, username: string, roles: [int]}}
     */
    toArray() {
        return {
            'id' : this.id,
            'name' : this.name,
        }
    }

    /**
     * @returns {string}
     */
    toJson() {
        return JSON.stringify(this.toArray());
    }

    /**
     *
     * @returns {string}
     */
    toString() {
        return this.toJson();
    }

    /**
     * @returns {string}
     */
    toStringWithoutId() {
        let array = this.toArray();
        delete array.id;
        return JSON.stringify(array);
    }
}