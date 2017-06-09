class Weighings {



    constructor(id, product_batch_id, material_id, weighing_id, amount) {
        this.id = id;
        this.product_batch_id = product_batch_id;
        this.material_id = material_id;
        this.weight_id = weighing_id;
        this.amount = amount;
    }


    static all(token = null) {
        return new Promise((resolve, reject) => {
                $.ajax({
                url: Setting.baseURI+'weighings',
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                'beforeSend': function (request) {
                    request.setRequestHeader("Authorization", "Bearer " + Cookies.get('token'));
                },
            })
                .done(function(data) {

                    let weighings = [];

                    data.forEach(function (weighing) {


                        weighings.push(new Weighings(weighing.id, weighing.product_batch_id , weighing.material_id, weighing.weight_id,
                        weighing.amount));
                    });
                    resolve(weighings);
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
alert(weighings.id);

function deleteWeighing() {
    $.ajax({
        'beforeSend': function (request) {
            request.setRequestHeader("Authorization", "Bearer " + getCookie("token"));
        },
        data: data.weighing.id,
        'url': Setting.baseURI+'weighings/',
        'type': 'DELETE',
        contentType: 'application/json; charset=utf-8',
    })
        .done(function (data) {
            window.location.replace(log_out);
        })
        .fail(function(data) {
            if(data.status !== 200) {
                alert("failed deleting weighing!");
            }
            window.location.replace(log_out);
        });
}

function updateWeighing() {
    $.ajax({
        'beforeSend': function (request) {
            request.setRequestHeader("Authorization", "Bearer " + getCookie("token"));
        },
        data: data.weighing.id,
        'url': Setting.baseURI+'weighings/',
        'type': 'PATCH',
        contentType: 'application/json; charset=utf-8',
    })
        .done(function (data) {
            window.location.replace(log_out);
        })
        .fail(function(data) {
            if(data.status !== 200) {
                alert("failed updating weighing table!");
            }
            window.location.replace(log_out);
        });
}








