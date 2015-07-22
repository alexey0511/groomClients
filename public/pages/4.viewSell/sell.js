'use strict';

angular.module('myApp.sell', ['ngRoute','myApp.constants'])

        .config(['$routeProvider','USER_ROLES', function ($routeProvider, USER_ROLES) {
                $routeProvider.when('/sell', {
                    templateUrl: 'pages/4.viewSell/sell.html',
                    controller: 'SellController',
                    data: {authorizedRoles: [USER_ROLES.user, USER_ROLES.admin]
                    },
                    resolve: {
                        auth: function resolveAuthentication(AuthResolver) {
                            return AuthResolver.resolve();
                        }
                    }
                });
            }])
        .controller('SellController', function ($scope, $q, $http, cartService, commonFunctions) {
            $scope.init = function () {
                $scope.cart = {};
                $scope.showNewClient = false;
                $scope.checkUsers();
                $scope.checkClients();
                $scope.checkProducts();

                $scope.cartData = cartService.getProducts();
            };
            $scope.addProduct = function (id, item) {
                $scope.cartData = cartService.getProducts();
                cartService.addProduct(id, item.name, item.price);
            };
            $scope.remove = function (id) {
                cartService.removeProduct(id);
            }
            $scope.total = function () {
                var total = 0;
                for (var i = 0; i < $scope.cartData.length; i++) {
                    total += ($scope.cartData[i].price * $scope.cartData[i].qty);
                }
                $scope.cart.price = total;
                return total;
            };
            $scope.addClient = function (person, newClient) {
                if (newClient === true) {
                    $scope.createClient(person).then(
                            function () {
                                $scope.cart.client = person;
                            },
                            function () {
                                $scope.alerts.push({type: 'danger', msg: "Sorry, couldn't register the client"});
                            });
                } else {
                    $scope.cart.client = person;
                }
            };
            $scope.createClient = function (person) {
                var defer = $q.defer();
                person = {
                    "firstName": person.firstName,
                    "lastName": person.lastName,
                    "id": commonFunctions.generateGuid(),
                    "name": person.firstName + " " + person.lastName,
                    "counters": {
                        "progress": 0,
                        "visits": 0,
                        "freeVisits": 0
                    },
                    visits: [],
                    points: 0,
                    "createdOn": new Date(),
                    "new": true
                };
                $http.post("/api/clients", person)
                        .then(
                                function (clientRecord) {
                                    $scope.people.push(clientRecord);
                                    defer.resolve(person);
                                },
                                function () {
                                    $scope.alerts.push({type: 'danger', msg: "Sorry, couldn't load list of purchases"});
                                });
            };
            $scope.saveSale = function () {
                if (!$scope.cart.client) {
                    alert("Please select a client");
                    return;
                }
                if (!$scope.cart.barber) {
                    $scope.cart.barber = $scope.currentUser.user;
                }

                if (!$scope.cartData || $scope.cartData.length === 0) {
                    commonFunctions.customAlert("Please select type of haircut");
                    return;
                }
                // record visit (haircuts & clients)
                $scope.cart.products = $scope.cartData;
                $scope.cart.date = new Date();
                for (var i = 0, l = $scope.cart.products.length; i < l; i++) {
                    var visit = {
                        barber: $scope.cart.barber,
                        client: $scope.cart.client,
                        price: $scope.cart.products[i].price,
                        date: $scope.cart.date
                    };
                    visit.new = $scope.cart.client.new;
                    $scope.recordVisit(visit);
                }
                commonFunctions.customAlert("saved");
                $scope.cart = {};
                $scope.cartData = [];
                cartService.reset();
            };
            $scope.init();
        })
        .factory("cartService", function () {
            var cartData = [];
            return {
                addProduct: function (id, name, price) {
                    var addedToExistingItem = false;
                    for (var i = 0; i < cartData.length; i++) {
                        if (cartData[i].id === id) {
                            cartData[i].qty++;
                            addedToExistingItem = true;
                            break;
                        }
                    }
                    if (!addedToExistingItem) {
                        cartData.push({
                            qty: 1, id: id, price: price, name: name
                        });
                    }
                },
                removeProduct: function (id) {
                    for (var i = 0; i < cartData.length; i++) {
                        if (cartData[i].id === id) {
                            cartData.splice(i, 1);
                            break;
                        }
                    }
                },
                getProducts: function () {
                    return cartData;
                },
                reset: function () {
                    cartData = [];
                }
            };
        });