function User(token) {
    this.token = token;
    this.name = "name lastname";
    this.roles = ['Admin', 'Lab technician', 'Foreman', 'Pharmaceud'];



    this.hasRole = function (role) {
        return this.roles.indexOf(role) != -1;
    }
}