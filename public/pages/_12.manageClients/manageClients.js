'use strict';

angular.module('myApp.manageClients', ['ngRoute', 'myApp.constants'])

        .config(['$routeProvider', 'user_ROLES', function ($routeProvider, user_ROLES) {
                $routeProvider.when('/manageClients', {
                    templateUrl: 'pages/_12.manageClients/manageClients.html',
                    controller: 'ManageClientsController',
                    data: {authorizedRoles: [user_ROLES.admin]
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
                $scope.clientList = clientsService.getClientsList();

                $scope.alerts = [];
                $scope.closeAlert = function (index) {
                    $scope.alerts.splice(index, 1);
                };
            };

            $scope.removeClient = function (id) {
                commonFunctions.adminProof().then(function (response) {
                    if (response) {
                        var clientIndex = clientsService.findClientIndex(id, $scope.clientList);
                        $http.post('/api/deleteClients', {adminProof: response, client: $scope.clientList[clientIndex]})
                                .success(function () {
                                    $scope.clientList.splice(clientIndex, 1);
                                    localStorage.setItem('clientsList', JSON.stringify({data: $scope.clientList, date: new Date().getTime()}));

                                })
                                .error(function (err, status) {
                                    if (status === 403) {
                                        commonFunctions.customAlert("You've provided wrong password!");
                                    } else {
                                        $scope.alerts[0] ={type: 'danger', msg: "Sorry, couldn't delete the client"};
                                    }
                                });
                    }
                });
            };
            $scope.openClient = function (id) {
                $location.path("/clients/" + id);
            };

            $scope.init();
        });