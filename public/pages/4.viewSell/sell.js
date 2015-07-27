'use strict';
angular.module('myApp.sell', ['ngRoute', 'myApp.constants'])

        .config(['$routeProvider', 'USER_ROLES', function ($routeProvider, USER_ROLES) {
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
        .controller('SellController', function ($scope, $q, $http, cartService, commonFunctions, clientsService) {
            $scope.init = function () {
                $scope.showNewClient = false;
                $scope.countPoints = false;
                $scope.shoppingCartPoints = 0;
                $scope.manualDiscountInput = 0;
                $scope.barberActive = {};
                $scope.productActive = {};
                $scope.clientActive = {};
                $scope.newClient = {
                    firstName: '',
                    lastName: ''
                };
                $scope.resetNameFilter();
                $scope.resetCart();
                $scope.checkUsers();
                $scope.checkStaffList().then(function () {
                    $scope.barberActive = $scope.staffList[0];
                });
                $scope.checkClients().then(function () {
                    $scope.anonymousClient = clientsService.getAnonymousClient($scope.clientList);
                    $scope.clientActive = $scope.anonymousClient;
                });
                $scope.checkProducts().then(function () {
                    $scope.productActive = $scope.products[0];
                });
                $scope.cartProducts = cartService.getProducts();
                $scope.cartServices = cartService.getServices();
            };

            $scope.clientSearch = function (client) {
                if (client.name && $scope.nameFilter.name !== '' && (client.name.toLowerCase().indexOf($scope.nameFilter.name.toLowerCase())) > -1) {
                    return client;
                }
                if (client.phone && $scope.nameFilter.phone !== '' && client.phone.indexOf($scope.nameFilter.phone) > -1) {
                    return client;
                }
                if ($scope.nameFilter.name === '' && $scope.nameFilter.phone === '') {
                    return client;
                }
            };

            $scope.resetCart = function () {
                $scope.cartProducts = [];
                $scope.cartServices = [];
                $scope.cart = {
                    client: null,
                    products: [],
                    services: [],
                    payment: 'eftpos'
                };
                $scope.countPoints = false;
            };
            $scope.toggleShowNewClient = function () {
                $scope.showNewClient = !$scope.showNewClient;
            };

            $scope.makeProductActive = function (product) {
                $scope.productActive = product;
            };
            $scope.checkProductActive = function (productId) {
                if (productId === $scope.productActive.id) {
                    return 'btn-warning';
                } else {
                    return 'btn-primary';
                }
            };
            $scope.makeClientActive = function (client) {
                $scope.clientActive = client;
                $scope.nameFilter.name = $scope.clientActive.name;
            };
            $scope.checkClientActive = function (clientId) {
                if (clientId === $scope.clientActive.id) {
                    return 'btn-warning';
                } else {
                    return 'btn-primary';
                }
            };
            $scope.makeBarberActive = function (barber) {
                $scope.barberActive = barber;
            };
            $scope.checkActiveBarber = function (barberId) {
                if ($scope.barberActive && barberId === $scope.barberActive.id) {
                    return 'btn-warning';
                } else {
                    return 'btn-primary';
                }
            };
            $scope.addToCart = function () {
                $scope.cart.barber = $scope.barberActive;
                $scope.cart.client = $scope.clientActive;
                if ($scope.productActive.type === 'service') {
                    $scope.cartServices = cartService.getServices();
                    cartService.addService($scope.productActive.id, $scope.productActive.name, $scope.productActive.price, $scope.barberActive);
                } else {
                    $scope.cartProducts = cartService.getProducts();
                    cartService.addProduct($scope.productActive.id, $scope.productActive.name, $scope.productActive.price);
                }
            };
            $scope.remove = function (id) {
                cartService.removeProductService(id);
            };
            $scope.subTotal = function () {
                var subTotal = 0;
                for (var i = 0; i < $scope.cartProducts.length; i++) {
                    subTotal += ($scope.cartProducts[i].price * $scope.cartProducts[i].qty);
                }
                for (var i = 0; i < $scope.cartServices.length; i++) {
                    subTotal += ($scope.cartServices[i].price * $scope.cartServices[i].qty);
                }
                return subTotal;
            };
            $scope.toggleCountPoints = function () {
                $scope.countPoints = !$scope.countPoints;
            };
            $scope.calcPoints = function () {
                var points = 0;
                if ($scope.countPoints) {
                    if ($scope.cart.client) {
                        if ($scope.cart.client.points > $scope.subTotal()) {
                            points = $scope.subTotal();
                        } else {
                            points = $scope.cart.client.points;
                        }
                    }
                } else {
                    points = 0;
                }
                return points;
            };
            $scope.manualDiscount = function () {
                var manualDiscount = 0;
                if ($scope.manualDiscountInput) {
                    if (isNaN(Number($scope.manualDiscountInput))) {
                        manualDiscount = 0;
                    }
                    if (Number($scope.manualDiscountInput) >= ($scope.subTotal() - $scope.calcPoints())) {
                        manualDiscount = ($scope.subTotal() - $scope.calcPoints());
                    } else {
                        manualDiscount = $scope.manualDiscountInput;
                    }
                } else {
                    manualDiscount = 0;
                }
                return manualDiscount;
            };
            $scope.total = function () {
                var total = 0;
                total = $scope.subTotal() - $scope.calcPoints() - $scope.manualDiscount();
                $scope.cart.price = $scope.total;
                return total;
            };
            $scope.addClientAndMakeActive = function () {
                $scope.createClient($scope.newClient).then(
                        function (createdClient) {
                            $scope.makeClientActive(createdClient);
                            $scope.toggleShowNewClient();
                            $scope.newClient = {};
                        },
                        function () {
                            $scope.alerts.push({type: 'danger', msg: "Sorry, couldn't register the client"});
                        });
            };
            $scope.createClient = function (person) {
                var defer = $q.defer();
                if (person.firstName || person.lastName) {
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
                                    function (response) {
                                        $scope.clientList.push(response.data);
                                        defer.resolve(response.data);
                                    },
                                    function () {
                                        $scope.alerts.push({type: 'danger', msg: "Sorry, couldn't load list of purchases"});
                                    });
                } else {
                    defer.reject();
                }
                return defer.promise;
            };
            $scope.saveSale = function () {
                if (!$scope.cart.client) {
                    commonFunctions.customAlert("Please select a client");
                    return;
                }
                if (!$scope.cart.barber) {
                    $scope.cart.barber = $scope.currentUser.user;
                }

                if ((!$scope.cartServices || $scope.cartServices.length === 0) && (!$scope.cartProducts || $scope.cartProducts.length === 0)) {
                    commonFunctions.customAlert("Please select type of haircut");
                    return;
                }
                // record visit (haircuts & clients)
                $scope.cart.products = $scope.cartProducts;
                $scope.cart.services = $scope.cartServices;
                $scope.cart.location = $scope.currentUser;
                $scope.cart.date = new Date();
                for (var i = 0, l = $scope.cart.services.length; i < l; i++) {
                    for (var j = 0; j < $scope.cart.services[i].qty; j++) {
                        var visit = {
                            barber: $scope.cart.services[i].barber,
                            client: $scope.cart.client,
                            price: $scope.cart.services[i].price,
                            date: $scope.cart.date
                        };
                        visit.new = $scope.cart.client.new;
                        $scope.recordVisit(visit);
                    }
                }
                if ($scope.countPoints) {
                    $scope.cart.client.points -= $scope.shoppingCartPoints;
                }
                $http.post('/api/orders', $scope.cart).then(function () {
                    $http.post('/api/clients', $scope.cart.client).then(function () {
                        commonFunctions.makeSaleSound();
                        commonFunctions.customAlert("Thank you");

                        // refresh local array
                        var clientIndex = clientsService.findClientIndex($scope.cart.client.id, $scope.clientList);
                        $scope.clientList[clientIndex].points = $scope.cart.client.points;


                        //refresh data
                        $scope.resetNameFilter();
                        $scope.resetCart();
                        cartService.reset();
                    }, function () {
                    });
                }, function () {
                });
            };
            $scope.resetNameFilter = function () {
                $scope.nameFilter = {
                    name: '',
                    phone: ''
                };
            };

            $scope.init();
        })
        .factory("cartService", function () {
            var cartProducts = [];
            var cartServices = [];
            return {
                addProduct: function (id, name, price) {
                    var addedToExistingItem = false;
                    for (var i = 0; i < cartProducts.length; i++) {
                        if (cartProducts[i].id === id) {
                            cartProducts[i].qty++;
                            addedToExistingItem = true;
                            break;
                        }
                    }
                    if (!addedToExistingItem) {
                        cartProducts.push({
                            qty: 1, id: id, price: price, name: name
                        });
                    }
                },
                removeProductService: function (id) {
                    var flag = false;
                    for (var i = 0; i < cartProducts.length; i++) {
                        if (cartProducts[i].id === id) {
                            cartProducts.splice(i, 1);
                            flag = true;
                            break;
                        }
                    }
                    if (flag === false) {
                        for (var i = 0; i < cartServices.length; i++) {
                            if (cartServices[i].id === id) {
                                cartServices.splice(i, 1);
                                flag = true;
                                break;
                            }
                        }
                    }
                },
                getProducts: function () {
                    return cartProducts;
                },
                addService: function (id, name, price, barber) {
                    var addedToExistingItem = false;
                    for (var i = 0; i < cartServices.length; i++) {
                        if (cartServices[i].id === id) {
                            cartServices[i].qty++;
                            addedToExistingItem = true;
                            break;
                        }
                    }
                    if (!addedToExistingItem) {
                        cartServices.push({
                            qty: 1, id: id, price: price, name: name, barber: barber
                        });
                    }
                },
                getServices: function () {
                    return cartServices;
                },
                reset: function () {
                    cartProducts = [];
                    cartServices = [];
                }
            };
        });