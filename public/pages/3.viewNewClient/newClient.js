'use strict';

angular.module('myApp.newclient', ['ngRoute', 'myApp.constants'])

        .config(['$routeProvider', 'USER_ROLES', function ($routeProvider, USER_ROLES) {
                $routeProvider.when('/newclient', {
                    templateUrl: 'pages/3.viewNewClient/newclient.html',
                    controller: 'NewClientController',
                    data: {authorizedRoles: [USER_ROLES.user, USER_ROLES.admin]
                    },
                    resolve: {
                        auth: function resolveAuthentication(AuthResolver) {
                            return AuthResolver.resolve();
                        }
                    }
                });
            }])
        .controller('NewClientController', function ($scope, $location, commonFunctions, $http, DEFAULT_SETTINGS) {
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
                        tokenNumber:''
                    };
                $scope.newClient = angular.copy($scope.newClientMaster);
            };
            $scope.addNewClient = function () {
                $scope.newClient.id = commonFunctions.generateGuid();
                $scope.newClient.name = $scope.newClient.firstName + " " + $scope.newClient.lastName;
                $scope.newClient.counters = {
                    progress: 0,
                    visits: 0                };
                $scope.newClient.lastVisit = new Date();
                $scope.newClient.createdOn = new Date();
                $scope.newClient.visits = [];
                $scope.newClient.points = 0;
                $scope.newClient.tokenNumber = '';
                // save to DB
                $http.post("/api/clients", $scope.newClient)
                        .success(function (clientRecord) {
                            $scope.clientList.push(clientRecord);
                            commonFunctions.customAlert("Thank you for visiting Groom Barbers")
                            $scope.resetNewClientForm();

                        });
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