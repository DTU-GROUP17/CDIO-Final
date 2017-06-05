const user = {
    token: Cookies.get('token'),
    id: null,
    name: "First Last",
    roles: [],

    hasRole: function (role) {
        for (let i = 0; i < this.roles.length; i++) {
            if(this.roles[0].name === role) {
                return true;
            }
        }
        return false;
    },

    /**
     * Loads the authenticated user into system cache.
     * @return {Promise}
     */
    load: function () {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: 'http://localhost:9998/self',
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                'beforeSend': function (request) {
                    request.setRequestHeader("Authorization", "Bearer " + Cookies.get('token'));
                },
            })
            .done(function(data) {
                user.name = data.name;
                user.roles = data.roles;
                user.id = data.id;

                resolve();
            })
            .fail(function () {
                reject();
            })
        });
    },

    /**
     * Logs the user into the system and returns true if successful.
     * @param {string} username
     * @param {string} password
     * @return {Promise}
     */
    login: function (username, password) {
        return new Promise((resolve, reject) => {
            $.ajax({
                type: "POST",
                url: 'http://localhost:9998/authentication/login',
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                data: JSON.stringify({
                    "userName": username,
                    "password": password
                })
            })
            .done(function(data) {
                Cookies.set('token', data.message);
                resolve(data.message);
            })
            .fail(function() {
                reject("User login failed!");
            });
        });

    },

};
