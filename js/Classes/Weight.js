class Weights {



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


    static all(token = null) {
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


                        weights.push(new Weights(weight.id, weight.name , weight.uri, weight.createdAt, weight.createdBy
                            , weight.updatedAt, weight.updatedBy, weight.deletedAt, weight.deletedBy));
                    });
                    resolve(weights);
                })
                .fail(function () {
                    reject();
                })
    });
    }


destroy() {
        return Weights.destroyById(this.id);
}
update() {
        return Weights.updateById(this.id);
    }


static destroyById(){

        return new Promises((resolve, reject) => {
            $.ajax({
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                'beforeSend' : function (request) {
                    request.setRequestHeader("Authorization", "Bearer" + Cookies.get('token'));
                },
            })
                .done(function (data) {

                    let weights = [];
                    data.forEach(function (weight){
                        resolve(data);
                    })
                        .fail(function(){
                            reject();
                        })




                })
    })
}

    static updateById(){

        return new Promises((resolve, reject) => {
            $.ajax({
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                'beforeSend' : function (request) {
                    request.setRequestHeader("Authorization", "Bearer" + Cookies.get('token'));
                },
            })
                .done(function (data) {

                    let weights = [];
                    data.forEach(function (weight){
                        resolve(data);
                    })
                        .fail(function(){
                            reject();
                        })




                })
        })
    }


}










