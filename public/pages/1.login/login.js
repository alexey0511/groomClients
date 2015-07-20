'use strict';

angular.module('myApp.Authentication', [])
        .controller('LoginController', function ($scope, $http, $rootScope, AUTH_EVENTS, AuthService, $location) {
            $scope.credentials = {
                username: '',
                password: ''
            };
            $scope.login = function (credentials) {
                AuthService.login(credentials).then(function (response) {
                    $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
                    if (response === true) {
                        $http.get('/api/me').then(function (response) {
                            $scope.setCurrentUser(response.data);
                    $location.path('/clients');
                        }, function (error) {
                            $scope.setCurrentUser(null);
                        });
                    }
                }, function () {
                    $rootScope.$broadcast(AUTH_EVENTS.loginFailed);
                });
            };
        })