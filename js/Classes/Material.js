class Material {
    constructor(id, stocked, used, created_at, component_id, supplier_id, created_by) {
        this.id = id;
        this.stocked = stocked;
        this.used = used;
        this.created_at = created_at;
        this.component_id = component_id;
        this.supplier_id = supplier_id;
        this.created_by = created_by;
    }


    static all(token = null) {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: Setting.baseURI+'materials',
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                'beforeSend': function (request) {
                    request.setRequestHeader("Authorization", "Bearer " + Cookies.get('token'));
                },
            })
                .done(function(data) {
                    let materials = [];
                    data.forEach(function (material) {
                        materials.push(new Material(material.id, material.stocked, material.used, material.created_at, material.component_id, material.supplier_id, material.created_by));
                    });
                    resolve(materials);
                })
                .fail(function () {
                    reject();
                })
        });
    }


}