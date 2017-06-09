class Recipes {



    constructor(id, name, created_at, created_by, deleted_at, deleted_by) {
        this.id = id;
        this.name = name;
        this.created_at = moment(created_at);
        this.created_by = created_by;
        this.deleted_at = moment(deleted_at);
        this.deleted_by = deleted_by;
    }


    static all(token = null) {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: Setting.baseURI+'recipes',
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                'beforeSend': function (request) {
                    request.setRequestHeader("Authorization", "Bearer " + Cookies.get('token'));
                },
            })
                .done(function(data) {

                    let recipes = [];

                    data.forEach(function (recipe) {


                        recipes.push(new Recipes(recipe.id, recipe.name , recipe.createdAt, recipe.createdBy
                            , recipe.deletedAt, recipe.deletedBy));
                    });
                    resolve(recipes);
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
alert(recipes.id);

function deleteRecipe() {
    $.ajax({
        'beforeSend': function (request) {
            request.setRequestHeader("Authorization", "Bearer " + getCookie("token"));
        },
        data: data.recipe.id,
        'url': Setting.baseURI+'recipes/',
        'type': 'DELETE',
        contentType: 'application/json; charset=utf-8',
    })
        .done(function (data) {
            window.location.replace(log_out);
        })
        .fail(function(data) {
            if(data.status !== 200) {
                alert("failed deleting recipe!");
            }
            window.location.replace(log_out);
        });
}

function createRecipe() {
    $.ajax({
        'beforeSend': function (request) {
            request.setRequestHeader("Authorization", "Bearer " + getCookie("token"));
        },
        data: data.recipe.id,
        'url': Setting.baseURI+'recipes/',
        'type': 'POST',
        contentType: 'application/json; charset=utf-8',
    })
        .done(function (data) {
            window.location.replace(log_out);
        })
        .fail(function(data) {
            if(data.status !== 200) {
                alert("failed updating recipe table!");
            }
            window.location.replace(log_out);
        });
}








