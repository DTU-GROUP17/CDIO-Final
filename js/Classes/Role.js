class Role extends Model{
    constructor(id, name) {
        super(id);
        this.name = name;
    }

    hasName(name) {
        return this.name === name;
    }

    toTable() {
        return this.name;
    }

    toArray() {
        return {
            'id' : this.id,
            'name' : this.name
        }
    }

    static fromArray(array) {
        return new Role(array.id, array.name);
    }

    /**
     * Translates a server user to an js user.
     *
     * @param role
     * @param multiple
     * @return Role|Role[]
     */
    static _responseToObject(role, multiple = false) {
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