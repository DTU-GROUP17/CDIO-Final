class Weight extends Model{
    constructor(id, name, uri, created_at, created_by, updated_at, updated_by, deleted_at, deleted_by) {
        super(id);
        this.name = name;
        this.weightUri = uri;
        this.created_at = created_at;
        this.created_by = created_by;
        this.updated_at = updated_at;
        this.updated_by = updated_by;
        this.deleted_at = deleted_at;
        this.deleted_by = deleted_by;
    }

    static get uri() {
        return Setting.weightURI;
    }

    /**
     *
     * @param object
     * @private
     * @returns Weight
     */
    static _responseToObject(object) {
        return new Weight(
            object.id,
            object.name,
            object.uri,
            object.createdAt === null ? null : moment(object.createdAt),
            object.createdBy === null ? null : object.createdBy.id,
            object.updatedAt === null ? null : moment(object.updatedAt),
            object.updatedBy === null ? null : object.updatedBy.id,
            object.deletedAt === null ? null : moment(object.deletedAt),
            object.deletedBy === null ? null : object.deletedBy.id
        );
    }

    /**
     *
     * @returns {{id: int, name: string, uri: string}}
     */
    toCreateArray() {
        return {
            'id' : this.id,
            'name' : this.name,
            'uri' : this.weightUri,
        }
    }

    /**
     *
     * @return {Promise}
     */
    update() {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: Setting.weightURI+this.id,
                type : 'PATCH',
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                beforeSend : function (request) {
                    request.setRequestHeader("Authorization", "Bearer " + Cookies.get('token'));
                },
                data : JSON.stringify({
                    'name' : this.name,
                     'uri' : this.weightUri,
                })
            })
                .done(function(data) {
                    resolve(data);
                })
                .fail(function(message) {
                    reject(message);
                })
        });
    }

}










