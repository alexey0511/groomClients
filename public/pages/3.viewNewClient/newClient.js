'use strict';

angular.module('myApp.newclient', ['ngRoute', 'myApp.constants'])

        .config(['$routeProvider', 'user_ROLES', function ($routeProvider, user_ROLES) {
                $routeProvider.when('/newclient', {
                    templateUrl: 'pages/3.viewNewClient/newclient.html',
                    controller: 'NewClientController',
                    data: {authorizedRoles: [user_ROLES.user, user_ROLES.admin]
                    },
                    resolve: {
                        auth: function resolveAuthentication(AuthResolver) {
                            return AuthResolver.resolve();
                        }
                    }
                });
            }])
        .controller('NewClientController', function ($scope, clientsService, commonFunctions) {
            $scope.init = function () {
                $scope.patterns = {};
                $scope.patterns.phone = new RegExp('^(64)');
                $scope.newClientMaster = {
                    id: '',
                    firstName: '',
                    lastName: '',
                    name: this.firstName + " " + this.lastName,
                    counters: {
                        progress: 0,
                        visits: 0
                    },
                    visits: [],
                    points: 0,
                    createdOn: new Date(),
                    newClient: true,
                    tokenNumber: ''
                };
                $scope.newClient = angular.copy($scope.newClientMaster);
            };
            $scope.addNewClient = function () {
                $scope.newClient.id = commonFunctions.generateGuid();
                $scope.newClient.name = $scope.newClient.firstName + " " + $scope.newClient.lastName;
                $scope.newClient.counters = {
                    progress: 0,
                    visits: 0};
                $scope.newClient.lastVisit = new Date();
                $scope.newClient.createdOn = new Date();
                $scope.newClient.visits = [];
                $scope.newClient.points = 0;
                $scope.newClient.tokenNumber = '';
                // save to DB
                clientsService.addClient($scope.newClient);
                $scope.resetNewClientForm();
            };
            $scope.resetNewClientForm = function () {
                $scope.newClient = angular.copy($scope.newClientMaster);
            };

            $scope.init();
        })
        .directive('newClientDialog', function (AUTH_EVENTS) {
            return {
                restrict: 'A',
                template: '<div ng-include="\'/pages/3.viewNewClient/newClientDialog.html\'"></div>',
                controller: 'NewClientController',
                link: function (scope) {
                    var showDialog = function () {
                        scope.visible = true;
                    };
                    scope.visible = false;
                }
            };
        });