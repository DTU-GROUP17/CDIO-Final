class Model{

    constructor(id) {
        this.id = id;
    }

    static get uri(){
        throw new ReferenceError('URI is not set on the model');
    }

    /**
     * @returns {{id : int}}
     */
    toCreateArray() {
        return {
            'id' : this.id
        }
    }

    toArray() {
        return {
            'id' : this.id
        }
    }

    /**
     * @returns {string}
     */
    toJson() {
        let object = this.toArray();
        object.isModel = true;
        object.type = this.constructor.name;
        return JSON.stringify(object);
    }

    static fromArray(array) {
        return new this(array.id);
    }

    static fromJson(json) {
        return this.fromArray(JSON.parse(json));
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
    toCreateResponse() {
        let array = this.toCreateArray();
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
                url: this.constructor.uri,
                type : 'POST',
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                data : this.toCreateResponse(),
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

    async createAndRefresh() {
        let model = await this.create();
        return await this.constructor.findWithRelations(model.id);
    }

    async createAndRefreshWithRelations() {
        let model = await this.create();
        return await this.constructor.findWithRelations(model.id);
    }

    /**
     *
     * @return {Promise}
     */
    destroy() {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: this.constructor.uri+this.id,
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

    static async findWithRelations(id) {
        let model = this._responseToObject(await this.find(id));

        for(let key of Object.keys(model)) {
            if (model[key] instanceof Model) {
                model[key] = await model[key].constructor.find(model[key].id);
            }
        }
        return model;

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

    static isModel(data) {
        try{
            data = JSON.parse(data);
            return data.isModel === true && 'type' in data;
        } catch (e) {
            return false;
        }
    }
}