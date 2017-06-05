var log_out = 'index.html';
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
/*
$(document).ready(function() {
    $('#table_weight').DataTable( {
        "processing": true,
        "serverSide": true,
        "ajax": "link" //Link should update

    } );
} );*/


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
                    return '<input type="text" class="form-control" id="name' + full.id + '" value="' + data + '" onchange="changeUser(\'' + full.id + '\', \'name\')">';
                },
            },
            {
                "data": "uri",
                "render": function (data, type, full) {
                    return '<input type="text" class="form-control" id="uri' + full.id + '" value="' + data + '" onchange="changeUser(\'' + full.id + '\', \'uri\')">';
                },

                "data": "created_at",
                "render": function (data, type, full) {
                    return '<input type="text" class="form-control" id="created_at' + full.id + '" value="' + data + '" onchange="changeUser(\'' + full.id + '\', \'created_at\')">';
                },

                "data": "created_by",
                "render": function (data, type, full) {
                    return '<input type="text" class="form-control" id="created_by' + full.id + '" value="' + data + '" onchange="changeUser(\'' + full.id + '\', \'created_by\')">';
                },

                "data": "updated_at",
                "render": function (data, type, full) {
                    return '<input type="text" class="form-control" id="updated_at' + full.id + '" value="' + data + '" onchange="changeUser(\'' + full.id + '\', \'updated_at\')">';
                },

                "data": "updated_by",
                "render": function (data, type, full) {
                    return '<input type="text" class="form-control" id="updated_by' + full.id + '" value="' + data + '" onchange="changeUser(\'' + full.id + '\', \'updated_by\')">';
                },

                "data": "deleted_at",
                "render": function (data, type, full) {
                    return '<input type="text" class="form-control" id="deleted_at' + full.id + '" value="' + data + '" onchange="changeUser(\'' + full.id + '\', \'deleted_at\')">';
                },

                "data": "deleted_by",
                "render": function (data, type, full) {
                    return '<input type="text" class="form-control" id="deleted_by' + full.id + '" value="' + data + '" onchange="changeUser(\'' + full.id + '\', \'deleted_by\')">';
                },

            },
            {
                "data": "roles",
                "render": function (data, type, full) {
                    return '<select class="selectpicker" id="roles_' + full.id + '" multiple><option>admin</option><option>user</option></select>';
                }
            },
            {
                "render": function (data, type, full) {
                    return '<input type="password" class="form-control" id="password_' + full.id + '" placeholder="********" onchange="changeUser(\'' + full.id + '\', \'password\')">';
                }
            },
            {
                "render": function (data, type, full) {
                    return '<button type="button" class="btn btn-xs btn-danger" onclick="deleteUser(\'' + full.id + '\')"><span class="glyphicon glyphicon glyphicon-remove"></span>&nbsp;</button>';
                }
            }
        ],
        "drawCallback": function () {
            this.api().data().each(function(row) {
                var selected = [];
                row.roles.forEach(function (data) {
                    selected.push(data.name);
                });

                var $selectPicker = $('#roles_' + row.id);
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
