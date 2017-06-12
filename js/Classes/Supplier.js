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
        return new Promise((resolve, reject) => {
            $.ajax({
                url: Setting.supplierURI+this.id,
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
}