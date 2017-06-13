class Model{

    constructor(id) {
        this.id = id;
    }

    static get uri(){
        throw new ReferenceError('URI is not set on the model');
    }

    get uri() {
        throw new ReferenceError('URI is not set on the model');
    }


    /**
     * @returns {{id : int}}
     */
    toArray() {
        return {
            'id' : this.id
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

    toTable() {
        return this.id;
    }

    /**
     * @returns {Promise}
     */
    create() {
        return new Promise((resolve, reject) => {
            let self = this;
            $.ajax({
                url: this.uri,
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

    /**
     *
     * @return {Promise}
     */
    destroy() {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: this.uri+this.id,
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

    /**
     *
     * @param {{}} object
     * @private
     * @returns this
     */
    static _responseToObject(object) {
        throw new ReferenceError('Response to object method is not defined on the model');
    }

    static find(id) {
        return new Promise((resolve, reject) => {
            let self = this;
            $.ajax({
                url: this.uri+id,
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                beforeSend : function (request) {
                    request.setRequestHeader("Authorization", "Bearer " + Cookies.get('token'));
                }
            })
                .done(function(data) {
                    resolve(self._responseToObject(data));
                })
                .fail(function(message) {
                    reject(message);
                })
        })
    }

    static all(token = null) {
        return new Promise((resolve, reject) => {
            let self = this;
            $.ajax({
                url: this.uri,
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                'beforeSend': function (request) {
                    request.setRequestHeader("Authorization", "Bearer " + Cookies.get('token'));
                },
            })
                .done(function(data) {
                    let models = [];
                    data.forEach(function (model) {
                        models.push(self._responseToObject(model));
                    });
                    resolve(models);
                })
                .fail(function () {
                    reject();
                })
        });
    }
}