'use strict'

angular.module('myApp.managestores', ['ngRoute', 'myApp.constants'])

        .config(['$routeProvider', 'store_ROLES', function ($routeProvider, store_ROLES) {
                $routeProvider.when('/managestores', {
                    templateUrl: 'pages/_11.manageStores/manageStores.html',
                    controller: 'managestoresController',
                    data: {authorizedRoles: [store_ROLES.admin]
                    },
                    resolve: {
                        auth: function resolveAuthentication(AuthResolver) {
                            return AuthResolver.resolve();
                        }
                    }
                });
            }])
        .controller('managestoresController', function ($scope, $http, commonFunctions, storeService, clientsService) {
            $scope.$on('newStoreList', function (event, data) {
                $scope.stores = data.storeList;
                console.log('delete');
            });

            $scope.init = function () {
                $scope.stores = storeService.getStoreList();

                $scope.alerts = [];
                $scope.closeAlert = function (index) {
                    $scope.alerts.splice(index, 1);
                };
            };

            $scope.addstore = function () {
                if ($scope.newstore && $scope.newstore.storename && $scope.newstore.password && $scope.newstore.role) {
                    $scope.newstore.id = commonFunctions.generateGuid();
                    $scope.stores.push($scope.newstore);
                    $http.post('/api/stores', $scope.newstore).then(
                            function () {
                                $scope.newstore = {};
                            },
                            function () {
                                $scope.alerts[0] ={type: 'danger', msg: "Sorry, couldn't add the store"};
                            });
                }
            };
            $scope.removestore = function (id) {
                commonFunctions.adminProof().then(function (response) {
                    if (response) {
                        var storeIndex = clientsService.findClientIndex(id, $scope.stores);
                        $http.post('/api/deletestores', {adminProof: response, store: $scope.stores[storeIndex]})
                                .success(function () {
                                    $scope.stores.splice(storeIndex, 1);
                                })
                                .error(function () {
                                   $scope.alerts[0] ={type: 'danger', msg: "Sorry, couldn't delete the store"};
                                });
                    }
                });
            };
            $scope.init();
        });