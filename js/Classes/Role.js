class Role {
    constructor(id, name) {
        this.id = id;
        this.name = name;
    }


    hasName(name) {
        return this.name === name;
    }


    /**
     * Translates a server user to an js user.
     *
     * @param role
     * @param multiple
     * @return Role|Role[]
     */
    static fromServer(role, multiple = false) {
        if(role === undefined) {
            return [];
        }

        if(multiple === true) {
            let roles = [];
            role.forEach(function(role) {
                roles.push(new Role(role.id, role.name))
            });
            return roles;
        }

        return new Role(role.id, role.name);
    }
}