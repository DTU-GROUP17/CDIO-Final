class Supplier {
    constructor(id, name) {
        this.id = id;
        this.name = name;
    }

    update() {

    }

    create() {

    }

    /**
     *
     * @return {Promise}
     */
    destroy() {
        return Supplier.destroyById(this.id);
    }

    /**
     *
     * @param {int} id
     * @return {Promise}
     */
    static destroyById(id) {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: Setting.supplierURI+id,
                type : 'DELETE',
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
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

    static all() {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: Setting.supplierURI,
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                'beforeSend': function (request) {
                    request.setRequestHeader("Authorization", "Bearer " + Cookies.get('token'));
                },
            })
                .done(function(data) {
                    let suppliers = [];
                    data.forEach(function (supplier) {
                        suppliers.push(new Supplier(supplier.id, supplier.name));
                    });
                    resolve(users);
                })
                .fail(function () {
                    reject();
                })
        });
    }
}