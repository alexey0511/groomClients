'use strict';
angular.module('myApp.clients', ['ngRoute', 'myApp.dialogs', 'ui.bootstrap', 'myApp.constants'])
        .config(['$routeProvider', 'store_ROLES', function ($routeProvider, store_ROLES) {
                $routeProvider.when('/clients', {
                    templateUrl: 'pages/2.viewClients/clients.html',
                    controller: 'ClientsController',
                    data: {authorizedRoles: [store_ROLES.store, store_ROLES.admin]
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
                        authorizedRoles: [store_ROLES.store, store_ROLES.admin]
                    },
                    resolve: {
                        auth: function resolveAuthentication(AuthResolver) {
                            return AuthResolver.resolve();
                        }
                    }});
            }])
        .controller('SingleClientController', function ($scope, clientsService, commonFunctions, $location, $routeParams, $http) {
            $scope.init = function () {
                $scope.clientList = clientsService.getClientsList();
                $scope.getClient();

            };

            $scope.getClient = function () {
                $scope.client = clientsService.getClient($routeParams.id);
                if ($scope.client) {
                    $http.get('/api/visits/' + $scope.client.id)
                            .success(function (response) {
                                $scope.VisitsArray = response;
                            });
                } else {
                    commonFunctions.customAlert("Client not found");
                }
            };
            $scope.updateClient = function () {
                $scope.client.name = $scope.client.firstName + " " + $scope.client.lastName;
                clientsService.updateClient($scope.client);
                $location.path("/clients");
            };

            $scope.init();
        })
        .controller('ClientsController', function ($scope, $modal, commonFunctions, $rootScope, $http, clientsService, $location, DEFAULT_SETTINGS) {
            $scope.init = function () {
                $scope.currentPage = 0;
                $scope.pageSize = 50;
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


