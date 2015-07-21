'use strict';

angular.module('myApp.sell', ['ngRoute'])

        .config(['$routeProvider', function ($routeProvider) {
                $routeProvider.when('/sell', {
                    templateUrl: 'pages/4.viewSell/sell.html',
                    controller: 'SellController'
                });
            }])
        .controller('SellController', function ($scope, $q, $http, cartService, commonFunctions) {
            $scope.init = function () {
                $scope.cart = {};
                $scope.showNewClient = false;
                $scope.getUsers()
                        .then(function () {
                            $scope.getClients()
                                    .then(function () {
                                        $scope.getProducts();
                                    });
                        });
                $scope.cartData = cartService.getProducts();
            };
            $scope.getUsers = function () {
                var defer = $q.defer();
                $http.get('/api/getUserList')
                        .success(function (response) {
                            $scope.users = response;
                            for (var i = 0, l = $scope.users.length; i < l; i++) {
                                if ($scope.users[i] === $scope.currentUser.user) {
                                    $scope.cart.barber = $scope.users[i];
                                }
                            }
                            defer.resolve();
                        });
                return defer.promise;
            };
            $scope.getClients = function () {
                var defer = $q.defer();
                $http.get('/api/getClients')
                        .success(function (response) {
                            $scope.setPeopleList(response);
                            defer.resolve();
                        })
                        .error(function () {
                            alert("can't connect to database")
                            defer.reject();
                        });
                return defer.promise;
            };
            $scope.getProducts = function () {
                var defer = $q.defer();
                $http.get('/api/getProducts')
                        .success(function (response) {
                            $scope.products = response;
//                            $scope.cartData = response;

                            defer.resolve();
                        });
                return defer.promise;
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
            }
            $scope.addClient = function (person, newClient) {
                if (newClient === true) {
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
                        visits:[],
                        points:0,
                        "createdOn": new Date(),
                        "new": true
                    };
                    $http.post("/api/clients", person)
                            .success(function (clientRecord) {
                                $scope.people.push(clientRecord);
                                $scope.cart.client = person;
                            });
                } else {
                    $scope.cart.client = person;
                }
            }
            $scope.saveSale = function () {
                if (!$scope.cart.client) {
                    alert("Please select a client");
                    // TODO - set focus
                    return;
                }
                if (!$scope.cart.barber) {
                    $scope.cart.barber = $scope.currentUser.user;
                }

                if (!$scope.cartData || $scope.cartData.length == 0) {
                    alert("Please select type of haircut");
                    return;
                }
                // record visit (haircuts & clients)
                $scope.cart.products = $scope.cartData;
                $scope.cart.date = new Date();

                // temprorary (delete after data switched from haircuts to prize)
                console.log("SAVING...", $scope.cart);
                var todayDate = new Date();
                for (var i = 0, l = $scope.cart.products.length; i < l; i++) {
                    var visit = {
                        barber: $scope.cart.barber,
                        client: $scope.cart.client,
                        price: $scope.cart.products[i].price,
                        date: todayDate,
                        new : false
                    };
                    $scope.recordVisit(visit);
                }
                alert("saved");
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