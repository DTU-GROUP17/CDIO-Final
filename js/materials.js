

$(document).ready(function () {



/* Datatable

    $("#myTableMaterials").DataTable({
        "language": {
            "paginate": {
                "previous": "Forige side",
                "next": "Næste side"
            }
        },
        "paging": true,
        "info": false,
        "select": false,
        "ordering": false,
        "searching": false,

    });

*/

/* jTable */

    $('#PersonTableContainer').jtable({
        title: 'Table of materials',
        ajaxSettings: {
            type: 'GET',
            dataType: 'json',
            url: 'http://jsonplaceholder.typicode.com/posts'
        },
        actions: {
            listAction: '/GettingStarted/PersonList',
            createAction: '/GettingStarted/CreatePerson',
            updateAction: '/GettingStarted/UpdatePerson',
            deleteAction: '/GettingStarted/DeletePerson'
        },
        fields: {
            Id: {
                key: true,
                list: false
            },
            Name: {
                title: 'Author Name',
                width: '40%'
            },
            Age: {
                title: 'Age',
                width: '20%'
            },
            RecordDate: {
                title: 'Record date',
                width: '30%',
                type: 'date',
                create: false,
                edit: false
            }
        }
    });



});