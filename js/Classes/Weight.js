class Weight {



    constructor(id, name, uri, created_at, created_by, updated_at, updated_by, deleted_at, deleted_by) {
        this.id = id;
        this.name = name;
        this.uri = uri;
        this.created_at = moment(created_at);
        this.created_by = created_by;
        this.updated_at = moment(updated_at);
        this.updated_by = updated_by;
        this.deleted_at = moment(deleted_at);
        this.deleted_by = deleted_by;
    }


    static all() {
        return new Promise((resolve, reject) => {
                $.ajax({
                url: Setting.baseURI+'weights',
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                'beforeSend': function (request) {
                    request.setRequestHeader("Authorization", "Bearer " + Cookies.get('token'));
                },
            })
                .done(function(data) {

                    let weights = [];

                    data.forEach(function (weight) {


                        weights.push(new Weight(weight.id, weight.name , weight.uri, weight.createdAt, weight.createdBy
                            , weight.updatedAt, weight.updatedBy, weight.deletedAt, weight.deletedBy));
                    });
                    resolve(weights);
                })
                .fail(function () {
                    reject();
                })
    });
    }

    /**
     *
     * @returns {{name: string, uri: string}}
     */
    toArray() {
        return {

            'name' : this.name,
            'uri' : this.uri,

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


    /**
     *
     * @return {Promise}
     */
    destroy() {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: Setting.weightURI+this.id,
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
     * @return {Promise}
     */
    update() {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: Setting.weightURI+this.id,
                type : 'PATCH',
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                beforeSend : function (request) {
                    request.setRequestHeader("Authorization", "Bearer " + Cookies.get('token'));
                },
                data : JSON.stringify({
                    'name' : this.name,
                     'uri' : this.uri,
                })
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
                url: Setting.weightURI,
                type : 'POST',
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                data : this.toStringWithoutId(),
                beforeSend : function (request) {
                    request.setRequestHeader("Authorization", "Bearer " + Cookies.get('token'));
                },
            })
                .done(function(data) {
                    $.ajax({
                        url: Setting.weightURI,
                        type : 'GET',
                        contentType: "application/json; charset=utf-8",
                        dataType: 'json',
                        data : 'weightId',
                        beforeSend : function (request) {
                            request.setRequestHeader("Authorization", "Bearer " + Cookies.get('token'));
                        },
                    }),

                    console.log(data);
                    resolve(self);


                })
                .fail(function(message) {
                    reject(message);
                })
        });
    }








}










