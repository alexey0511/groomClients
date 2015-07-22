'use strict';

angular.module('myApp.manageProducts', ['ngRoute','myApp.constants'])

        .config(['$routeProvider', 'USER_ROLES', function ($routeProvider, USER_ROLES) {
                $routeProvider.when('/manageproducts', {
                    templateUrl: 'pages/_10.manageProducts/manageProducts.html',
                    controller: 'ManageProductsController',
                    data: {authorizedRoles: [USER_ROLES.admin]
                    },
                    resolve: {
                        auth: function resolveAuthentication(AuthResolver) {
                            return AuthResolver.resolve();
                        }
                    }
                });
            }])
        .controller('ManageProductsController', function ($scope, $http, commonFunctions, clientsService) {
            $scope.init = function () {
                $scope.checkProducts().then(null, function () {
                    $scope.alerts.push({type: 'danger', msg: "Sorry, couldn't load product list"});
                });
                $scope.alerts = [];
                $scope.closeAlert = function (index) {
                    $scope.alerts.splice(index, 1);
                };
            };
            $scope.addProduct = function () {
                if ($scope.newProduct && $scope.newProduct.name && $scope.newProduct.price) {
                    $scope.newProduct.id = commonFunctions.generateGuid();
                    $scope.products.push($scope.newProduct);
                    $http.post('/api/products', $scope.newProduct).then(
                            function () {
                                $scope.newProduct = {};
                            },
                            function () {
                                $scope.alerts.push({type: 'danger', msg: "Sorry, couldn't add the product"});
                            });
                }
            };
            $scope.removeProduct = function (id) {
                commonFunctions.adminProof().then(function (response) {
                    if (response) {
                        var productIndex = clientsService.findClientIndex(id, $scope.products);
                        $http.post('/api/deleteProducts', $scope.products[productIndex]).then(
                                function () {
                                    $scope.products.splice(productIndex, 1);
                                },
                                function () {
                                    $scope.alerts.push({type: 'danger', msg: "Sorry, couldn't delete the product"});
                                });
                    }
                });
            };
            $scope.init();
        }); 
