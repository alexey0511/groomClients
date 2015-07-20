'use strict';
angular.module('myApp.clients', ['ngRoute'])
        .constant("DEFAULT_SETTINGS", {
            numberVisits: 6,
            winMessage: "HALF PRICE HAIR CUT",
            defaultPrice: "35"
        })
        .controller('SingleClientController', function ($scope, $q, $location, $routeParams, $http) {
            $scope.qrClient = "";
            $scope.checkClientsList = function () {
                var defer = $q.defer();
                if (Array.isArray($scope.people) && $scope.people.length > 0) {
                    defer.resolve();
                } else {
                    $http.get('/api/getClients')
                            .success(function (response) {
                                $scope.setPeopleList(response);
                                defer.resolve();
                            })
                            .error(function () {
                                alert("can't connect to database")
                                defer.reject();
                            });
                }
                return defer.promise;
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
                    alert("Client not found");
                }
            };
            $scope.checkClientsList().then(function () {
                $scope.getClient();
            }, function () {
                alert("Client not found");
            });
            $scope.updateClient = function () {
                $http.post('/api/clients/' + $scope.client.id, $scope.client)
                        .success(function (r) {
                            $location.path("/clients");
                        });
            };
        })
        .controller('ClientsController', function ($scope, AUTH_EVENTS, $rootScope, $http, clientsService, $location, DEFAULT_SETTINGS) {

            $scope.isLoginPage = false;

            $http.get('/api/getClients')
                    .success(function (response) {
                        $scope.setPeopleList(response);
                    });
// BOF PAGINATION 
            $scope.currentPage = 0;
            $scope.pageSize = 50;
            $scope.numberOfPages = function () {
                if (typeof $rootScope.people !== "undefined") {
                    return Math.ceil($rootScope.people.length / $scope.pageSize);
                }
            }
// EOF PAGINATION 
            $scope.openClient = function (id) {
                $location.path("/clients/" + id);
            };
            $scope.addHairCut = function (id) {
                var clientIndex = clientsService.findClientIndex(id, $scope.people);
                var visit = {};
                visit = {
                    barber: $scope.currentUser.user,
                    client: $scope.people[clientIndex],
                    price: DEFAULT_SETTINGS.defaultPrice,
                    date: new Date(),
                    new : false
                };
                $scope.recordVisit(visit);
            };
            $scope.removeHairCut = function (id) {
                var clientIndex = clientsService.findClientIndex(id, $scope.people);
                $scope.verifyCountersNum(clientIndex);
                var response = confirm("Do you want to remove haircut?");
                if (response) {
                    if ($scope.people[clientIndex].counters.freeVisits > 0
                            && $scope.people[clientIndex].counters.visits > 0) {
                        $scope.people[clientIndex].counters.freeVisits -= 1;
                    }
                    if ($scope.people[clientIndex].counters.progress > 0) {
                        $scope.people[clientIndex].counters.progress -= 1;
                    }
                    if ($scope.people[clientIndex].counters.visits > 0) {
                        $scope.people[clientIndex].counters.visits -= 1;
                    }
                    // Update record in DB
                    $http.post('/api/clients', $scope.people[clientIndex]);
                }
            };
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