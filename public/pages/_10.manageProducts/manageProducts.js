'use strict';

angular.module('myApp.manageProducts', ['ngRoute', 'myApp.constants'])

        .config(['$routeProvider', 'user_ROLES', function ($routeProvider, user_ROLES) {
                $routeProvider.when('/manageproducts', {
                    templateUrl: 'pages/_10.manageProducts/manageProducts.html',
                    controller: 'ManageProductsController',
                    data: {authorizedRoles: [user_ROLES.admin]
                    },
                    resolve: {
                        auth: function resolveAuthentication(AuthResolver) {
                            return AuthResolver.resolve();
                        }
                    }
                });
            }])
        .controller('ManageProductsController', function ($scope, $http, commonFunctions, productsService, clientsService) {

            $scope.$on('newProductList', function (event, data) {
                $scope.products = data.products;
            });
            $scope.init = function () {
                $scope.products = productsService.getProducts();
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
                                 $scope.alerts[0] ={type: 'danger', msg: "Sorry, couldn't add the product"};
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
                                    $scope.alerts[0] ={type: 'danger', msg: "Sorry, couldn't delete the product"};
                                });
                    }
                });
            };
            $scope.init();
        });
