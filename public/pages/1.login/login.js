'use strict';

angular.module('myApp.Authentication', ['myApp.constants'])
        .config(['$routeProvider', 'user_ROLES', function ($routeProvider) {
                $routeProvider.when('/login', {
                    templateUrl: 'pages/1.login/login.html',
                    controller: 'LoginController'
                });
            }])
        .controller('LoginController', function ($scope, $http, $rootScope, AUTH_EVENTS, AuthService, $location) {
            $rootScope.$on(AUTH_EVENTS.loginFailed, function () {
                $scope.alerts[0] = {type: 'danger', msg: "salon or password are incorrect"};
            });

            $scope.credentials = {
                username: '',
                password: ''
            };
            $scope.login = function (credentials) {
                AuthService.login(credentials).then(function (response) {
                    $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
                    if (response === true) {
                        $http.get('/api/me').then(function (response) {
                            $scope.setCurrentuser(response.data);
                            $location.path('/clients');
                        }, function (error) {
                            $scope.setCurrentuser(null);
                             $scope.alerts[0] = {type: 'danger', msg: "Can't load your profile"};
                        });
                    }
                }, function () {
                });
            };
        })
        .directive('loginDialog', function (AUTH_EVENTS) {
            return {
                restrict: 'A',
                template: '<div ng-if="visible" ng-include="\'/pages/1.login/loginDialog.html\'"></div>',
                controller: 'LoginController',
                link: function (scope) {
                    var showDialog = function () {
                        scope.visible = true;
                    };
                    var hideDialog = function () {
                        scope.visible = false;
                    }
                    scope.visible = false;
                    scope.$on(AUTH_EVENTS.notAuthenticated, showDialog);
                    scope.$on(AUTH_EVENTS.sessionTimeout, showDialog);
                    scope.$on(AUTH_EVENTS.loginSuccess, hideDialog);
                }
            };
        })
