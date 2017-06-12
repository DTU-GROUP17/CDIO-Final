
/**
 *
 * @param element
 * @constructor
 */
function Sidebar (element) {
    this.element = element;

    /**
     * Run this method for render the sidebar
     *
     * @param {User} user
     */
    this.render = function(user = null) {
        if(user === null) {
            user = currentUser;
        }

        let menus = this.menu.dashboard;

        if(user.hasRole('Admin')) {
            menus += this.menu.users + this.menu.weights;
        }
        if(user.hasRole('Pharmaceud')) {
            menus += this.menu.recipes + this.menu.suppliers + this.menu.materials;
        }
        if(user.hasRole('Foreman')) {
            menus += this.menu.batches + this.menu.materials;
        }
        if(user.hasRole('Lab technician')) {
            menus += this.menu.weighings;
        }

        this.element.html(menus);
    };

    /**
     * This object contains all the methods for the menus to the different menus we got in the system.
     */
    this.menu = new function() {
        /**
         * This method is used for generating the html needed for the buttons in th sidebar.
         * @param text
         * @param icon
         * @param url
         * @returns {string}
         */
        this.item = (function (text, icon, url) {
            return "<li><a onclick='$(\"#page-wrapper\").load(\""+url+".html\")'><i class='fa "+icon+" fa-fw'></i>"+text+"</a></li>";

        });

        this.dashboard = this.item('Dashboard', 'fa-dashboard', 'dashboard');
        this.users = this.item('Users', 'fa-user', 'users');
        this.weights = this.item('Weight', 'fa-tablet', 'weights');
        this.batches = this.item('Batches', 'fa-barcode', 'batches');
        this.weighings = this.item('Weighings', 'fa-table', 'weighings');
        this.materials = this.item('Materials', 'fa-tree', 'materials');
        this.suppliers = this.item('Suppliers', 'fa-building-o', 'suppliers');
        this.recipes = this.item('Recipes', 'fa-book', 'recipes');


    };
}
