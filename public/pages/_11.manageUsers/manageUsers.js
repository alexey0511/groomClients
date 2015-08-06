'use strict';

angular.module('myApp.manageUsers', ['ngRoute', 'myApp.constants'])

        .config(['$routeProvider', 'USER_ROLES', function ($routeProvider, USER_ROLES) {
                $routeProvider.when('/manageusers', {
                    templateUrl: 'pages/_11.manageUsers/manageUsers.html',
                    controller: 'manageUsersController',
                    data: {authorizedRoles: [USER_ROLES.admin]
                    },
                    resolve: {
                        auth: function resolveAuthentication(AuthResolver) {
                            return AuthResolver.resolve();
                        }
                    }
                });
            }])
        .controller('manageUsersController', function ($scope, $http, commonFunctions, storeService, clientsService) {
            $scope.$on('newStoreList', function (event, data) {
                $scope.users = data.storeList;
            });

            $scope.init = function () {
                $scope.users = storeService.getStoreList();

                $scope.alerts = [];
                $scope.closeAlert = function (index) {
                    $scope.alerts.splice(index, 1);
                };
            };

            $scope.addUser = function () {
                if ($scope.newUser && $scope.newUser.username && $scope.newUser.password && $scope.newUser.role) {
                    $scope.newUser.id = commonFunctions.generateGuid();
                    $scope.users.push($scope.newUser);
                    $http.post('/api/users', $scope.newUser).then(
                            function () {
                                $scope.newUser = {};
                            },
                            function () {
                                $scope.alerts.push({type: 'danger', msg: "Sorry, couldn't add the user"});
                            });
                }
            };
            $scope.removeUser = function (id) {
                commonFunctions.adminProof().then(function (response) {
                    if (response) {
                        var userIndex = clientsService.findClientIndex(id, $scope.users);
                        $http.post('/api/deleteUsers', {adminProof: response, user: $scope.users[userIndex]})
                                .success(function () {
                                    $scope.users.splice(userIndex, 1);
                                })
                                .error(function () {
                                    $scope.alerts.push({type: 'danger', msg: "Sorry, couldn't delete the user"});
                                });
                    }
                });
            };
            $scope.init();
        });