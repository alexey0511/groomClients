'use strict';
angular.module('myApp.clients', ['ngRoute', 'myApp.dialogs', 'ui.bootstrap', 'myApp.constants'])
        .config(['$routeProvider', 'USER_ROLES', function ($routeProvider, USER_ROLES) {
                $routeProvider.when('/clients', {
                    templateUrl: 'pages/2.viewClients/clients.html',
                    controller: 'ClientsController',
                    data: {authorizedRoles: [USER_ROLES.user, USER_ROLES.admin]
                    },
                    resolve: {
                        auth: function resolveAuthentication(AuthResolver) {
                            return AuthResolver.resolve();
                        }
                    }
                });
                $routeProvider.when('/clients/:id', {
                    templateUrl: 'pages/2.viewClients/client.html',
                    controller: 'SingleClientController',
                    data: {
                        authorizedRoles: [USER_ROLES.user, USER_ROLES.admin]
                    },
                    resolve: {
                        auth: function resolveAuthentication(AuthResolver) {
                            return AuthResolver.resolve();
                        }
                    }});
            }])
        .controller('SingleClientController', function ($scope, commonFunctions, $location, $routeParams, $http) {
            $scope.init = function () {
                $scope.qrClient = "";

                $scope.checkClients().then(function () {
                    $scope.getClient();
                }, function () {
                    commonFunctions.customAlert("Client not found");
                });
            };

            $scope.getClient = function () {
                $scope.client = $scope.findClient($routeParams.id);
                if ($scope.client) {
                    $scope.client.createdOn = new Date($scope.client.createdOn);
                    $scope.client.lastVisit = new Date($scope.client.lastVisit);
                    $scope.client.counters.visits = Number($scope.client.counters.visits);
                    $scope.client.counters.progress = Number($scope.client.counters.progress);
                    $scope.client.counters.freeVisits = Number($scope.client.counters.freeVisits);
                    // display QR code
                    if ($scope.client.qrcode) {
                        $scope.qrClient = $scope.client.qrcode.toString();
                    }
                    $http.get('/api/visits/' + $scope.client.id)
                            .success(function (response) {
                                $scope.VisitsArray = response;
                            });
                } else {
                    commonFunctions.customAlert("Client not found");
                }
            };
            $scope.updateClient = function () {
                $http.post('/api/clients/' + $scope.client.id, $scope.client)
                        .success(function (r) {
                            $location.path("/clients");
                        });
            };

            $scope.init();
        })
        .controller('ClientsController', function ($scope, $modal, commonFunctions, $rootScope, $http, clientsService, $location, DEFAULT_SETTINGS) {
            $scope.init = function () {
                $scope.currentPage = 0;
                $scope.pageSize = 50;

                $scope.checkClients();

            };
// BOF PAGINATION 
            $scope.numberOfPages = function () {
                if (typeof $rootScope.clientList !== "undefined") {
                    return Math.ceil($rootScope.clientList.length / $scope.pageSize);
                }
            };
// EOF PAGINATION 
            $scope.openClient = function (id) {
                $location.path("/clients/" + id);
            };
            $scope.addHairCut = function (id) {
                var clientIndex = clientsService.findClientIndex(id, $scope.clientList);
                if (!clientsService.lastVisitInAnHour($scope.clientList[clientIndex]) ||
                        confirm("It is a second in an hour, procceed?")) {

                    var visit = {};
                    visit = {
                        barber: $scope.currentUser.user,
                        client: $scope.clientList[clientIndex],
                        price: DEFAULT_SETTINGS.defaultPrice,
                        date: new Date()
                    };
                    visit.new = $scope.clientList[clientIndex].new;
                    $scope.recordVisit(visit);
                } else {
                    commonFunctions.customAlert("Nothing happened");
                }
            };
            $scope.removeHairCut = function (id) {
                var clientIndex = clientsService.findClientIndex(id, $scope.clientList);
                $scope.verifyCountersNum(clientIndex);
                commonFunctions.confirmDialog().then(function (response) {
                    if (response) {
                        $scope.decreaseCount(clientIndex);
                    }
                });
            };

            $scope.init();
        })

        /*
         * Filter used for pagination.
         * Defines from what number start in the list
         */
        .filter('startFrom', function () {
            return function (input, start, nameFilter) {
                if (typeof input !== "undefined" && input != null && typeof nameFilter === "undefined") {
                    start = +start; //parse to int
                    return input.slice(start);
                } else {
                    return input;
                }
            };
        })


