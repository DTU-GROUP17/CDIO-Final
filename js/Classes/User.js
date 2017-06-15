class User extends Model{
    constructor(id, name, username, roles, token = null, self = false, password = "") {
        super(id);
        this.token = token;
        this.name = name;
        this.roles = roles;
        this.username = username;
        this.self = self;
        this.password = password;
    }

    static get uri() {
        return Setting.userURI;
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
     * @return {Promise}
     */
    update() {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: this.self ? Setting.selfURI : Setting.userURI+this.id,
                type : 'PATCH',
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                beforeSend : function (request) {
                    request.setRequestHeader("Authorization", "Bearer " + Cookies.get('token'));
                },
                data : this.toCreateResponse()
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
     * @returns {{id : int, name: string, username: string, roles: [int]}}
     */
    toCreateArray() {
        let roles = [];
        if(this.roles instanceof Array) {
            this.roles.forEach(function (role){
               roles.push(role.id);
            });
            roles.push()
        }

        return {
            'id' : this.id,
            'name' : this.name,
            'username' : this.username,
            'roles' : roles,
            'password' : this.password
        }
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

        let self = this;
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
                    resolve(self._responseToObject(data));
                })
                .fail(function () {
                    reject();
                })
        });
    }

    /**
     *
     * @param object
     * @private
     * @returns User
     */
    static _responseToObject(object) {
        return new User(
            object.id,
            object.name,
            object.username,
            Role._responseToObject(object.roles, true)
        );
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