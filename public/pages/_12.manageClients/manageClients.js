'use strict';

angular.module('myApp.manageClients', ['ngRoute','myApp.constants'])

        .config(['$routeProvider', 'USER_ROLES', function ($routeProvider, USER_ROLES) {
                $routeProvider.when('/manageClients', {
                    templateUrl: 'pages/_12.manageClients/manageClients.html',
                    controller: 'ManageClientsController',
                    data: {authorizedRoles: [USER_ROLES.admin]
                    },
                    resolve: {
                        auth: function resolveAuthentication(AuthResolver) {
                            return AuthResolver.resolve();
                        }
                    }
                });
            }])

        .controller('ManageClientsController', function ($scope, commonFunctions, $http, $location, clientsService) {
            $scope.init = function () {
                $scope.checkClients().then(null, function () {
                    $scope.alerts.push({type: 'danger', msg: "Sorry, couldn't load client list"});
                });

                $scope.alerts = [];
                $scope.closeAlert = function (index) {
                    $scope.alerts.splice(index, 1);
                };
            };

            $scope.removeClient = function (id) {
                commonFunctions.adminProof().then(function (response) {
                    if (response) {
                        var clientIndex = clientsService.findClientIndex(id, $scope.people);
                        $http.post('/api/deleteClients', {adminProof: response, client: $scope.people[clientIndex]})
                                .success(function () {
                                    $scope.people.splice(clientIndex, 1);
                                })
                                .error(function (err, status) {
                                    if (status === 403) {
                                        commonFunctions.customAlert("You've provided wrong password!");
                                    } else {
                                        $scope.alerts.push({type: 'danger', msg: "Sorry, couldn't delete the client"});
                                    }
                                });
                    }
                });
            };
            $scope.openClient = function (id) {
                var clientIndex;
                clientIndex = clientsService.findClientIndex(id, $scope.people);
                if (clientIndex || clientIndex === 0) {
                    var id = $scope.people[clientIndex].id;
                    $location.path("/clients/" + id);
                }
            };

            $scope.init();
        });