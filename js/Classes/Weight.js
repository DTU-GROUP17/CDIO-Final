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



    /**
     * Logs the user into the system and returns true if successful.
     * @param {string} username
     * @param {string} password
     * @return {Promise}
     */
    static login(username, password) {
        return new Promise((resolve, reject) => {
            $.ajax({
                type: "POST",
                url: Setting.baseURI+'authentication/login',
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                data: JSON.stringify({
                    "userName": username,
                    "password": password
                })
            })
                .done(function(data) {
                    console.log('done');
                    Cookies.set('token', data.message);
                    resolve(data.message);
                })
                .fail(function() {
                    console.log('failed');
                    reject("User login failed!");
                });
        });

    }



}
alert(Weights.id);

function deleteWeight() {
    $.ajax({
        'beforeSend': function (request) {
            request.setRequestHeader("Authorization", "Bearer " + getCookie("token"));
        },
        data: data.weight.id,
        'url': Setting.baseURI+'weights/',
        'type': 'DELETE',
        contentType: 'application/json; charset=utf-8',
    })
        .done(function (data) {
            window.location.replace(log_out);
        })
        .fail(function(data) {
            if(data.status !== 200) {
                alert("failed deleting weight!");
            }
            window.location.replace(log_out);
        });
}

function updateWeight() {
    $.ajax({
        'beforeSend': function (request) {
            request.setRequestHeader("Authorization", "Bearer " + getCookie("token"));
        },
        data: data.weight.id,
        'url': Setting.baseURI+'weights/',
        'type': 'PATCH',
        contentType: 'application/json; charset=utf-8',
    })
        .done(function (data) {
            window.location.replace(log_out);
        })
        .fail(function(data) {
            if(data.status !== 200) {
                alert("failed updating weight table!");
            }
            window.location.replace(log_out);
        });
}








