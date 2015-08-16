'use strict'

angular.module('myApp.manageUsers', ['ngRoute', 'myApp.constants'])

        .config(['$routeProvider', 'user_ROLES', function ($routeProvider, user_ROLES) {
                $routeProvider.when('/manageUsers', {
                    templateUrl: 'pages/_11.manageUsers/manageUsers.html',
                    controller: 'manageUsersController',
                    data: {authorizedRoles: [user_ROLES.admin]
                    },
                    resolve: {
                        auth: function resolveAuthentication(AuthResolver) {
                            return AuthResolver.resolve();
                        }
                    }
                });
            }])
        .controller('manageUsersController', function ($scope, $http, commonFunctions, userservice, clientsService) {
            $scope.$on('newuserList', function (event, data) {
                $scope.users = data.userList;
                console.log('delete');
            });

            $scope.init = function () {
                $scope.users = userservice.getuserList();

                $scope.alerts = [];
                $scope.closeAlert = function (index) {
                    $scope.alerts.splice(index, 1);
                };
            };

            $scope.adduser = function () {
                if ($scope.newuser && $scope.newuser.username && $scope.newuser.password && $scope.newuser.role) {
                    $scope.newuser.id = commonFunctions.generateGuid();
                    $scope.users.push($scope.newuser);
                    $http.post('/api/users', $scope.newuser).then(
                            function () {
                                $scope.newuser = {};
                            },
                            function () {
                                $scope.alerts[0] ={type: 'danger', msg: "Sorry, couldn't add the user"};
                            });
                }
            };
            $scope.removeuser = function (id) {
                commonFunctions.adminProof().then(function (response) {
                    if (response) {
                        var userIndex = clientsService.findClientIndex(id, $scope.users);
                        $http.post('/api/deleteusers', {adminProof: response, user: $scope.users[userIndex]})
                                .success(function () {
                                    $scope.users.splice(userIndex, 1);
                                })
                                .error(function () {
                                   $scope.alerts[0] ={type: 'danger', msg: "Sorry, couldn't delete the user"};
                                });
                    }
                });
            };
            $scope.init();
        });