/*var log_out = 'index.html';
var urluser = 'http://localhost:9998/users/';


function getCookie(cname) {

    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function deleteRecord() {
    $.ajax({
        'beforeSend': function (request) {
            request.setRequestHeader("Authorization", "Bearer " + getCookie("token"));
        },
        'url': url,  // Need to set Url
        'type': 'DELETE',
        contentType: 'application/json; charset=utf-8',
    })
        .done(function (data) {
            window.location.replace(log_out);
        })
        .fail(function(data) {
            console.log("???"); // PLZ DO not delete, master comment fixer???! WTF DUDE!!!!!
            if(data.status !== 200) {
                alert("failed deleting user!");
            }
            window.location.replace(log_out);
        });
}

function changeRecord(record_id, type) {
    var val = $('#'+type+'_'+record_id).val();

    var data  = {};
    data[type] = val;

    $.ajax({
        'beforeSend': function (request) {
            request.setRequestHeader("Authorization", "Bearer " + getCookie("token"));
        },
        'url': urlUser,  // Url should change
        'type': 'PATCH',
        'data': JSON.stringify(data),
        contentType: 'application/json; charset=utf-8',
    }).done(function(data) {
    })
        .fail(function(data) {
            if(data.status !== 200) {
                alert("failed updating record!");
            }
            if(type === "id") {   //check id ??!!
                window.location.replace(log_out);
            }
        });
}*/


class Weights {
    constructor(id, name, uri, created_at, created_by, updated_at, updated_by, deleted_at, deleted_by) {
        this.id = id;
        this.name = name;
        this.uri = uri;
        this.created_at = created_at;
        this.created_by = created_by;
        this.updated_at = updated_at;
        this.updated_by = updated_by;
        this.deleted_at = deleted_at;
        this.deleted_by = deleted_by;
    }

    static all(token = null) {
        return new Promise((resolve, reject) => {
                $.ajax({
                url: Setting.baseURI+'weights',
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                'beforeSend': function (request) {
                    request.setRequestHeader("Authorization", "Bearer " + Cookies.get('token'));
                },
            })
                .done(function(data) {
                    let weights = [];
                    data.forEach(function (weights) {
                        weights.push(new Weights(weights.id , weights.name , weights.uri, weights.created_at, weights.created_by, weights.updated_at , weights.updated_by, weights.deleted_at, weights.deleted_by ));
                    });
                    resolve(weights);
                })
                .fail(function () {
                    reject();
                })
    });
    }


}















/*
function initTable() {
    $("#table_weight").dataTable({
        "searching": false,
        "paging": false,
        "info": false,
        "sort": false,
        "columns": [
            {"data": "id"},
            {"data": "name"},
            {"data": "uri"},
            {"data": "created_at"},
            {"data": "created_by"},
            {"data": "updated_at"},
            {"data": "updated_by"},
            {"data": "deleted_at"},
            {"data": "deleted_by"},
            {
                // https://datatables.net/manual/data/renderers
                "data": "name",
                "render": function (data, type, full) {
                    return '<input type="text" class="form-control" id="name' + full.id + '" value="' + data + '" onchange="changeRecord(\'' + full.id + '\', \'name\')">';
                },
            },
            {
                "data": "uri",
                "render": function (data, type, full) {
                    return '<input type="text" class="form-control" id="uri' + full.id + '" value="' + data + '" onchange="changeRecord(\'' + full.id + '\', \'uri\')">';
                },

                "data": "created_at",
                "render": function (data, type, full) {
                    return '<input type="text" class="form-control" id="created_at' + full.id + '" value="' + data + '" onchange="changeRecord(\'' + full.id + '\', \'created_at\')">';
                },

                "data": "created_by",
                "render": function (data, type, full) {
                    return '<input type="text" class="form-control" id="created_by' + full.id + '" value="' + data + '" onchange="changeRecord(\'' + full.id + '\', \'created_by\')">';
                },

                "data": "updated_at",
                "render": function (data, type, full) {
                    return '<input type="text" class="form-control" id="updated_at' + full.id + '" value="' + data + '" onchange="changeRecord(\'' + full.id + '\', \'updated_at\')">';
                },

                "data": "updated_by",
                "render": function (data, type, full) {
                    return '<input type="text" class="form-control" id="updated_by' + full.id + '" value="' + data + '" onchange="changeRecord(\'' + full.id + '\', \'updated_by\')">';
                },

                "data": "deleted_at",
                "render": function (data, type, full) {
                    return '<input type="text" class="form-control" id="deleted_at' + full.id + '" value="' + data + '" onchange="changeRecord(\'' + full.id + '\', \'deleted_at\')">';
                },

                "data": "deleted_by",
                "render": function (data, type, full) {
                    return '<input type="text" class="form-control" id="deleted_by' + full.id + '" value="' + data + '" onchange="changeRecord(\'' + full.id + '\', \'deleted_by\')">';
                },

            },
            {
                "render": function (data, type, full) {
                    return '<button type="button" class="btn btn-xs btn-danger" onclick="deleteRecord(\'' + full.id + '\')"><span class="glyphicon glyphicon glyphicon-remove"></span>&nbsp;</button>';
                }
            }
        ],
        "drawCallback": function () {
            this.api().data().each(function(row) {
                var selected = [];
                row.roles.forEach(function (data) {
                    selected.push(data.name);
                });

                var $selectPicker = $('#_' + row.id);
                $selectPicker.selectpicker('val', selected);
                $selectPicker.on('changed.bs.select', function (e) {
                    roles = {
                        'roles': $(e.currentTarget).val()
                    };
                    $.ajax({
                        'beforeSend': function (request) {
                            request.setRequestHeader("Authorization", "Bearer " + getCookie("token"));
                        },
                        'url': urluser + row.id,
                        'type': 'PATCH',
                        'data': JSON.stringify(roles),
                        contentType: 'application/json; charset=utf-8',
                    })
                        .fail(function (data) {
                            if (data.status !== 200) {
                                alert("failed setting roles!");
                            }
                        });
                });
            });

        },
        'ajax': {
            'url': urluser,
            'type': 'GET',
            'beforeSend': function (request) {
                request.setRequestHeader("Authorization", "Bearer " + getCookie("token"));
            },
            "dataSrc": function (data) {
                var returns = [];
                for (var i = 0; i < data.length; i++) {
                    returns[i] = {
                        "id": data[i].id,
                        "name": data[i].name,
                        "username": data[i].userName,
                        "roles": data[i].roles
                    }
                }
                return returns;
            }
        }
    });
}
*/
