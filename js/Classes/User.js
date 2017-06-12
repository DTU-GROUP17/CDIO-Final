class User {
    constructor(id, name, username, roles, token = null, self = false) {
        this.token = token;
        this.id = id;
        this.name = name;
        this.roles = roles;
        this.username = username;
        this.self = self;
    }

    hasRole(role) {
        for (let i = 0; i < this.roles.length; i++) {
            if(this.roles[i].hasName(role) ) {
                return true;
            }
        }
        return false;
    }

    /**
     *
     * @return {Promise}
     */
    destroy() {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: this.self ? Setting.selfURI : Setting.userURI+this.id,
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
     * @param {int} id
     * @return {Promise}
     */
    static destroyById(id) {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: Setting.userURI+id,
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
                });
        });
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
                url: Setting.selfURI,
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                'beforeSend': function (request) {
                    request.setRequestHeader("Authorization", "Bearer " + token);
                },
            })
                .done(function(data) {
                    let user = new User(data.id, data.name, data.username, Role.fromServer(data.roles, true), token, true);
                    resolve(user);
                })
                .fail(function () {
                    reject();
                })
        });
    }

    static all() {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: Setting.userURI,
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
                url: Setting.loginURI,
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