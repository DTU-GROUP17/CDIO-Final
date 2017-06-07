class User {
    constructor(id, name, username, roles, token = null) {
        this.token = token;
        this.id = id;
        this.name = name;
        this.roles = roles;
        this.username = username;
    }

    hasRole(role) {
        for (let i = 0; i < this.roles.length; i++) {
            if(this.roles[0].hasName(role) ) {
                return true;
            }
        }
        return false;
    }

    /**
     *
     * @param token
     * @return {Promise}
     */
    static loadUserFromToken(token = null) {
        if(token === null) {
            token = Cookies.get('token');
        }

        return new Promise((resolve, reject) => {
            $.ajax({
                url: Setting.baseURI+'self',
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                'beforeSend': function (request) {
                    request.setRequestHeader("Authorization", "Bearer " + token);
                },
            })
                .done(function(data) {
                    let user = new User(data.id, data.name, data.username, Role.fromServer(data.roles, true), token);
                    console.log(user);
                    resolve(user);
                })
                .fail(function () {
                    reject();
                })
        });
    }

    static all(token = null) {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: Setting.baseURI+'users',
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                'beforeSend': function (request) {
                    request.setRequestHeader("Authorization", "Bearer " + Cookies.get('token'));
                },
            })
                .done(function(data) {
                    let users = [];
                    data.forEach(function (user) {
                        users.push(new User(user.id, user.name, user.username, Role.fromServer(user.roles, true)));
                    });
                    resolve(users);
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