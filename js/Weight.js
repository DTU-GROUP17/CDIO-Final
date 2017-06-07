/*var log_out = 'index.html';
var urluser = 'http://localhost:9998/users/';


function getCookie(cname) {

    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function deleteRecord() {
    $.ajax({
        'beforeSend': function (request) {
            request.setRequestHeader("Authorization", "Bearer " + getCookie("token"));
        },
        'url': url,  // Need to set Url
        'type': 'DELETE',
        contentType: 'application/json; charset=utf-8',
    })
        .done(function (data) {
            window.location.replace(log_out);
        })
        .fail(function(data) {
            console.log("???"); // PLZ DO not delete, master comment fixer???! WTF DUDE!!!!!
            if(data.status !== 200) {
                alert("failed deleting user!");
            }
            window.location.replace(log_out);
        });
}

function changeRecord(record_id, type) {
    var val = $('#'+type+'_'+record_id).val();

    var data  = {};
    data[type] = val;

    $.ajax({
        'beforeSend': function (request) {
            request.setRequestHeader("Authorization", "Bearer " + getCookie("token"));
        },
        'url': urlUser,  // Url should change
        'type': 'PATCH',
        'data': JSON.stringify(data),
        contentType: 'application/json; charset=utf-8',
    }).done(function(data) {
    })
        .fail(function(data) {
            if(data.status !== 200) {
                alert("failed updating record!");
            }
            if(type === "id") {   //check id ??!!
                window.location.replace(log_out);
            }
        });
}*/


class Weights {
    constructor(id, name, uri, created_at, created_by, updated_at, updated_by, deleted_at, deleted_by) {
        this.id = id;
        this.name = name;
        this.uri = uri;
        this.created_at = created_at;
        this.created_by = created_by;
        this.updated_at = updated_at;
        this.updated_by = updated_by;
        this.deleted_at = deleted_at;
        this.deleted_by = deleted_by;
    }

    static all(token = null) {
        return new Promise((resolve, reject) => {
                $.ajax({
                url: Setting.baseURI+'self',
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                'beforeSend': function (request) {
                    request.setRequestHeader("Authorization", "Bearer " + Cookies.get('token'));
                },
            })
                .done(function(data) {
                    let weights = [];
                    data.forEach(function (weights) {
                        weights.push(new Weights(weights.id , weights.name , weights.uri, weights.created_at, weights.created_by, weights.updated_at , weights.updated_by, weights.deleted_at, weights.deleted_by ));
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








