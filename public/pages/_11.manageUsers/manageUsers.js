'use strict';

angular.module('myApp.manageUsers', ['ngRoute'])

        .config(['$routeProvider', '$httpProvider', function ($routeProvider, $httpProvider) {
                $httpProvider.defaults.headers.common["Access-Control-Allow-Origin"] = "*";
                delete $httpProvider.defaults.headers.common['X-Requested-With'];
                $routeProvider.when('/manageusers', {
                    templateUrl: 'pages/_11.manageUsers/manageUsers.html',
                    controller: 'manageUsersController'
                });
            }])
        .controller('manageUsersController', function ($scope, $http, commonFunctions, clientsService) {
            $http.get('/api/getUsers')
                    .success(function (response) {
                        $scope.users = response;
                    });
//            $scope.scanning = true;

            $scope.addUser = function () {
                if ($scope.newUser && $scope.newUser.username && $scope.newUser.password && $scope.newUser.role) {
                    $scope.newUser.id = commonFunctions.generateGuid();
                    $scope.users.push($scope.newUser);
                    $http.post('/api/users', $scope.newUser)
                            .success(function (p) {
                                console.log("ADD NEW USER ", p.id);
                            });
                    $scope.newUser = {};
                }
                ;
            }
            $scope.removeUser = function (id) {
                commonFunctions.adminProof().then(function (response) {
                    if (response) {
                        console.log("-- DELETINT USER", id);
                        var userIndex = clientsService.findClientIndex(id, $scope.users);
                        var user = $scope.users.splice(userIndex, 1);
                        console.log(user[0]._id);
                        $http.post('/api/deleteUsers', {adminProof: response, user: user[0]});
                    }
                });
            };
        });