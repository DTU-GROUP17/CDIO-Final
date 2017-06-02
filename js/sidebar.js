
/**
 *
 * @param element
 * @constructor
 */
function Sidebar (element) {
    this.element = element;
    /**
     * @param {User} user
     */
    this.show = function(user) {
        var menus = this.menu.dashboard;

        if(user.hasRole('Admin')) {
            menus += this.menu.users + this.menu.weights;
        }
        if(user.hasRole('Pharmaceud')) {
            menus += this.menu.recipes + this.menu.suppliers;
        }
        if(user.hasRole('Foreman')) {
            menus += this.menu.batches + this.menu.materials;
        }
        if(user.hasRole('Lab technician')) {
            menus += this.menu.weighings;
        }

        this.element.html(menus);
    };



    this.menu = new function() {
        this.item = function(text, icon, url) {
            return "<li><a href='"+url+".html'><i class='fa "+icon+" fa-fw'></i>"+text+"</a></li>";
        };

        this.dashboard = this.item('Dashboard', 'fa-dashboard', 'index');
        this.users = this.item('Users', 'fa-user', 'users');
        this.weights = this.item('Weights', 'fa-tablet', 'weights');
        this.batches = this.item('Batches', 'fa-barcode', 'batches');
        this.weighings = this.item('Weighings', 'fa-table', 'weighings');
        this.materials = this.item('Materials', 'fa-tree', 'materials');
        this.suppliers = this.item('Suppliers', 'fa-building-o', 'suppliers');
        this.recipes = this.item('Recipes', 'fa-book', 'recipes');

    };
}
