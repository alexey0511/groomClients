'use strict';

angular.module('myApp.manageClients', ['ngRoute', 'myApp.constants'])

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
            $scope.$on('newClientsList', function (event, data) {
                $scope.clientsList = data.clientsList;
            });
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
                clientIndex = clientsService.findClientIndex(id, $scope.clientList);
                if (clientIndex || clientIndex === 0) {
                    var id = $scope.clientList[clientIndex].id;
                    $location.path("/clients/" + id);
                }
            };

            $scope.init();
        });