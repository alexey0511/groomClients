'use strict';

angular.module('myApp.newclient', ['ngRoute'])

        .config(['$routeProvider', function ($routeProvider) {
                $routeProvider.when('/newclient', {
                    templateUrl: 'pages/3.viewNewClient/newclient.html',
                    controller: 'NewClientController'
                });
            }])
        .controller('NewClientController', function ($scope, $location, commonFunctions, $http, DEFAULT_SETTINGS) {

            $scope.patterns = {};
            $scope.patterns.phone = new RegExp('^(64)');
            $scope.newClientMaster = {
                firstName: '',
                lastName: ''
            };
            $scope.newClient = angular.copy($scope.newClientMaster);
            $scope.addNewClient = function () {
                $scope.newClient.id = commonFunctions.generateGuid();
                $scope.newClient.name = $scope.newClient.firstName + " " + $scope.newClient.lastName;
                $scope.newClient.counters = {
                    "progress": 0,
                    "visits": 0,
                    "freeVisits": 0
                };
                $scope.newClient.lastVisit = new Date();
                $scope.newClient.createdOn = new Date();
                // save to DB
                console.log("NEW", $scope.newClient);
                var visit = {
                    barber: $scope.currentUser.user,
                    client: $scope.newClient,
                    price: DEFAULT_SETTINGS.defaultPrice,
                    date: new Date(),
                    new : true
                };
                $http.post("/api/clients", $scope.newClient)
                        .success(function (clientRecord) {
                            $scope.people.push(clientRecord);
                            $scope.recordVisit(visit);
                            $scope.resetNewClientForm();
                            alert("Thank you for visiting Groom Barbers")

                        });
            };
            $scope.resetNewClientForm = function () {
                $scope.newClient = angular.copy($scope.newClientMaster);
            };
        });