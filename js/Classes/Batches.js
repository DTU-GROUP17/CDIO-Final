class Batches {

    constructor(id, recipe_id, status, weighed_by, weighed_at, created_at, created_by) {
        this.id = id;
        this.recipe_id = recipe_id;
        this.status = status;
        this.weighed_by = weighed_by;
        this.weighed_at = moment(weighed_at);
        this.created_at = moment(created_at);
        this.created_by = created_by;
    }


    static all(token = null) {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: Setting.baseURI+'batches',
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                'beforeSend': function (request) {
                    request.setRequestHeader("Authorization", "Bearer " + Cookies.get('token'));
                },
            })
                .done(function(data) {

                    let batches = [];

                    data.forEach(function (batch) {


                        batches.push(new Batches(batch.id, batch.recipe_id , batch.status, batch.weighed_by, batch.weighed_at
                            , batch.created_at, batch.created_by));
                    });
                    resolve(batches);
                })
                .fail(function () {
                    reject();
                })
        });
    }






}
alert(batch.id);

function deleteBatch() {
    $.ajax({
        'beforeSend': function (request) {
            request.setRequestHeader("Authorization", "Bearer " + getCookie("token"));
        },
        data: data.batch.id,
        'url': Setting.baseURI+'batches/',
        'type': 'DELETE',
        contentType: 'application/json; charset=utf-8',
    })
        .done(function (data) {
            window.location.replace(log_out);
        })
        .fail(function(data) {
            if(data.status !== 200) {
                alert("failed deleting batch!");
            }
            window.location.replace(log_out);
        });
}

function createBatch() {
    $.ajax({
        'beforeSend': function (request) {
            request.setRequestHeader("Authorization", "Bearer " + getCookie("token"));
        },
        data: data.batch.id,
        'url': Setting.baseURI+'batches/',
        'type': 'POST',
        contentType: 'application/json; charset=utf-8',
    })
        .done(function (data) {
            window.location.replace(log_out);
        })
        .fail(function(data) {
            if(data.status !== 200) {
                alert("failed updating batch table!");
            }
            window.location.replace(log_out);
        });
}








