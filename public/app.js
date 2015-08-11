'use strict';
// Declare app level module which depends on views, and components
angular.module('myApp', [
    'ngRoute',
    'myApp.constants',
    'myApp.clients',
    'myApp.sell',
    'myApp.visits',
    'myApp.newclient',
    'myApp.manageProducts',
    'myApp.manageUsers',
    'myApp.manageClients',
    'myApp.manageStaff',
    'ngCookies',
    'myApp.report',
    'ui.bootstrap',
    'myApp.version',
    'myApp.Authentication',
    'myApp.txting'])
        .config(['$routeProvider', '$httpProvider', function ($routeProvider, $httpProvider) {
                //                delete $httpProvider.defaults.headers.common['X-Requested-With'];
                $httpProvider.interceptors.push(['$injector', function ($injector) {
                        return $injector.get('authInterceptor');
                    }
                ]);
                $httpProvider.defaults.headers.common["Access-Control-Allow-Origin"] = "*";
                delete $httpProvider.defaults.headers.common['X-Requested-With'];
                $routeProvider.otherwise({redirectTo: '/clients'});
            }])
        .controller('ApplicationController', function ($scope, $http, $q, Session, $rootScope, $cookieStore, $location,
                productsService, staffService, storeService, visitsService, clientsService,
                AUTH_EVENTS, DEFAULT_SETTINGS, commonFunctions) {
            $rootScope.$on(AUTH_EVENTS.notAuthenticated, function () {
                $scope.logout();
                $location.path('/login');
            });
            $rootScope.$on(AUTH_EVENTS.notAuthorized, function () {
                $scope.logout();
                $location.path('/login');
            });
            $scope.$on('newClientList', function (event, data) {
                $scope.clientList = data.clientsList;
            });
            $scope.init = function () {
                productsService.initProducts();
                staffService.staffListInit();
                storeService.storeListInit();
                visitsService.visitsInit();
                clientsService.clientsListInit();
                $scope.alerts = [];
                $scope.clientList = [];
                $scope.visits = [];
                $scope.currentUser = null;
                $scope.closeAlert = function (index) {
                    $scope.alerts.splice(index, 1);
                };
                if ($location.path() !== '/login') {
                    $scope.isLoginPage = false;
                } else {
                    $scope.isLoginPage = true;
                }
                if ($cookieStore.get('userInfo')) {
                    $scope.setCurrentUser($cookieStore.get('userInfo'));
                }
                $scope.clientList = clientsService.getClientsList();

                $scope.barcodeScan();
            };
            $scope.barcodeScan = function () {
                var pressed = false;
                var chars = [];
                $(window).keypress(function (e) {
                    if (e.which >= 48 && e.which <= 57) {
                        chars.push(String.fromCharCode(e.which));
                    }
                    if (pressed === false) {
                        setTimeout(function () {
                            if (chars.length >= 5) {
                                var barcode = chars.join("");
                                //                var barcode = '15107';
                                console.log("Barcode Scanned: " + barcode);
                                var client = clientsService.findClientByQrCode(barcode, $scope.clientList);
                                console.log(client);
                                console.log($location.path());
                                $location.path('/sell');
                                $scope.$broadcast('barcodeInputClient', {
                                    client: client
                                });
                            }
                            chars = [];
                            pressed = false;
                        }, 500);
                    }
                    pressed = true;
                });
            };
            $scope.findClient = function (id) {
                for (var i = 0, listLength = $scope.clientList.length; i < listLength; i++) {
                    if (typeof $scope.clientList[i].id === 'undefined') {
                        $scope.clientList[i].id = $scope.clientList[i]._id;
                    }
                    if ($scope.clientList[i].id.toString() === id) {
                        return $scope.clientList[i];
                    }
                }
                return null;
            };
            $scope.setCurrentUser = function (user) {
                $scope.currentUser = user;
                $cookieStore.put('userInfo', user);
                Session.create(1, user.user, user.role);
            };
            $scope.logout = function () {
                delete $scope.currentUser;
                $cookieStore.remove('userInfo');
                Session.destroy();
            };
            $scope.recordVisit = function (visit) {
                var clientIndex = clientsService.findClientIndex(visit.client.id, $scope.clientList);
                $scope.increaseCount(clientIndex); // redeem right away - use half price haircut
                if ($scope.clientList[clientIndex].counters.progress === DEFAULT_SETTINGS.numberVisits) {
                    // Invoking immediatelly for now. ToDo: implement invoke on button click;
                    $scope.redeemCoupon(clientIndex);
                }
                $http.post('/api/visits', visit)
                        .success(function () {
                            var clientVisitId = visit.id;
                            if (!$scope.clientList[clientIndex].visits) {
                                $scope.clientList[clientIndex].visits = [];
                            }
                            $scope.clientList[clientIndex].lastVisit = new Date();
                            $scope.clientList[clientIndex].visits.push(clientVisitId);
                            visitsService.addVisit(visit);
                            $http.post('/api/clients', $scope.clientList[clientIndex])
                                    .success(function () {
                                    })
                                    .error(function (err) {
                                        console.log("ERROR OCCURED", err);
                                    });
                        });
            };
            $scope.increaseCount = function (clientIndex) {
                $scope.verifyCountersNum(clientIndex);
                if (Array.isArray($scope.clientList) && typeof ($scope.clientList[clientIndex]) !== 'undefined'
                        && typeof ($scope.clientList[clientIndex].counters) !== 'undefined') {
                    if ($scope.clientList[clientIndex].name !== 'Casual Customer') {
                        $scope.clientList[clientIndex].counters.progress += 1;
                    } else {
                        $scope.clientList[clientIndex].counters.progress = 0;
                    }
                    $scope.clientList[clientIndex].counters.visits += 1;
                    $scope.clientList[clientIndex].lastVisit = new Date();
                } else {
                    console.log("Error while adding...");
                }
            };
            $scope.decreaseCount = function (clientIndex) {
                if ($scope.clientList[clientIndex].counters.progress > 0) {
                    $http.post('/api/removeLatestPurchase', {client: $scope.clientList[clientIndex]})
                            .success(function () {
                                if ($scope.clientList[clientIndex].counters.progress > 0) {
                                    $scope.clientList[clientIndex].counters.progress -= 1;
                                }
                                if ($scope.clientList[clientIndex].counters.visits > 0) {
                                    $scope.clientList[clientIndex].counters.visits -= 1;
                                }
                                // Update record in DB
                                $http.post('/api/clients', $scope.clientList[clientIndex]);
                            });
                }
            };
            $scope.redeemCoupon = function (clientIndex) {
                $scope.clientList[clientIndex].counters.progress = 0;
                commonFunctions.customAlert(DEFAULT_SETTINGS.winMessage);
            };
            $scope.verifyCountersNum = function (clientIndex) {
                if (!Number($scope.clientList[clientIndex].counters.progress) || $scope.clientList[clientIndex].counters.progress === 'NaN')
                {
                    parseInt($scope.clientList[clientIndex].counters.progress);
                }
                if (!Number($scope.clientList[clientIndex].counters.visits) || $scope.clientList[clientIndex].counters.visits === 'NaN')
                {
                    parseInt($scope.clientList[clientIndex].counters.visits);
                }
            };
            $scope.init();
        })
        .service('commonFunctions', function ($modal, $q) {
            return {
                generateGuid: function guid() {
                    function s4() {
                        return Math.floor((1 + Math.random()) * 0x10000).toString(16)
                                .substring(1);
                    }
                    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                            s4() + '-' + s4() + s4() + s4();
                },
                makeSaleSound: function (snd) {
                    var snd = new Audio("./img/sale.wav"); // buffers automatically when created
                    snd.play();
                },
                confirmDialog: function () {
                    var defer = $q.defer();
                    var modalInstance = $modal.open({
                        animation: true,
                        templateUrl: 'pages/partials/ConfirmRemove.html',
                        controller: 'ConfirmRemoveController',
                        size: 'sm'
                    });
                    modalInstance.result.then(function (result) {
                        defer.resolve(result);
                    }, function () {
                        defer.reject(false);
                    });
                    return defer.promise;
                },
                adminProof: function () {
                    var defer = $q.defer();
                    var modalInstance = $modal.open({
                        animation: true,
                        templateUrl: 'pages/partials/adminProof.html',
                        controller: 'adminProofController',
                        size: 'sm'});
                    modalInstance.result.then(function (result) {
                        defer.resolve(result);
                    }, function () {
                        defer.reject(false);
                    });
                    return defer.promise;
                },
                customAlert: function (alert) {
                    var defer = $q.defer();
                    var modalInstance = $modal.open({
                        animation: true,
                        templateUrl: 'pages/partials/customAlert.html',
                        controller: 'customAlertController',
                        size: 'sm',
                        resolve: {
                            alert: function () {
                                return alert;
                            }
                        }
                    });
                    modalInstance.result.then(function (result) {
                        defer.resolve(true);
                    }, function () {
                        defer.reject(false);
                    });
                    return defer.promise;
                }
            };
        })
        .directive('focusMe', function ($timeout, $parse) {
            return {
                //scope: true,   // optionally create a child scope
                link: function (scope, element, attrs) {
                    var model = $parse(attrs.focusMe);
                    scope.$watch(model, function (value) {
                        if (value === true) {
                            $timeout(function () {
                                element[0].focus();
                            });
                        }
                    });
                    // to address @blesh's comment, set attribute value to 'false'
                    // on blur event:
                    element.bind('blur', function () {
                        if (typeof model.assign === 'function') {
                            scope.$apply(model.assign(scope, false));
                        }
                    });
                }
            };
        })
        .directive('capitalizeFirst', function ($parse) {
            return {
                require: 'ngModel',
                link: function (scope, element, attrs, modelCtrl) {
                    var capitalize = function (inputValue) {
                        if (inputValue === undefined) {
                            inputValue = '';
                        }
                        var capitalized = inputValue.charAt(0).toUpperCase() +
                                inputValue.substring(1);
                        if (capitalized !== inputValue) {
                            modelCtrl.$setViewValue(capitalized);
                            modelCtrl.$render();
                        }
                        return capitalized;
                    }
                    modelCtrl.$parsers.push(capitalize);
                    capitalize($parse(attrs.ngModel)(scope)); // capitalize initial value
                }
            };
        }).factory('authInterceptor', function ($rootScope, $q, $cookieStore, AUTH_EVENTS, $location) {
    return {
        request: function (config) {
            config.headers = config.headers || {};
            if ($cookieStore.get('userToken')) {
                config.headers.Authorization = 'Bearer ' + $cookieStore.get('userToken');
            }
            return config;
        },
        responseError: function (response) {
            $rootScope.$broadcast({
                401: AUTH_EVENTS.notAuthenticated,
                403: AUTH_EVENTS.notAuthorized,
                419: AUTH_EVENTS.sessionTimeout,
                440: AUTH_EVENTS.sessionTimeout
            }[response.status], response);
            return $q.reject(response);
            if (response.status === 401) {
                $location.path('/login');
            }
            return response || $q.when(response);
        }
    };
})
        .factory('AuthService', function ($http, Session, $cookieStore, $rootScope, AUTH_EVENTS) {
            var authService = {};
            authService.login = function (credentials) {
                return $http
                        .post('/authenticate', credentials)
                        .then(function (res) {
                            res.data.token ?
                                    $cookieStore.put('userToken', res.data.token)
                                    : $cookieStore.remove('userToken');
                            return true;
                        }, function (res) {
                            $rootScope.$broadcast(AUTH_EVENTS.loginFailed);
                            $cookieStore.remove('userToken');
                            return false;
                        });
            };
            authService.isAuthenticated = function () {
                return !!Session.userId;
            };
            authService.isAuthorized = function (authorizedRoles) {
                if (!Array.isArray(authorizedRoles)) {
                    authorizedRoles = [authorizedRoles];
                }
                return (authService.isAuthenticated() &&
                        authorizedRoles.indexOf(Session.userRole) !== -1);
            };
            authService.logout = function () {

            };
            return authService;
        })
        .service('Session', function () {
            this.create = function (sessionId, userId, userRole) {
                this.id = sessionId;
                this.userId = userId;
                this.userRole = userRole;
            };
            this.destroy = function () {
                this.id = null;
                this.userId = null;
                this.userRole = null;
            };
        })
        .factory('AuthResolver', function ($q, $rootScope, $location) {
            return {
                resolve: function () {
                    var deferred = $q.defer();
                    var unwatch = $rootScope.$watch('$$childHead.currentUser', function (currentUser) {
                        if (angular.isDefined(currentUser) && currentUser) {
                            deferred.resolve(currentUser);
                        } else {
                            deferred.reject();
                            $location.path('/login');
                        }
                        unwatch();
                    });
                    return deferred.promise;
                }
            };
        })
        .factory('clientsService', function clientsService($http, $q, $rootScope, commonFunctions) {
            var clientsList = [];
            return {
                getClientsList: function () {
                    return clientsList;
                },
                clientsListInit: function () {
                    if (localStorage.getItem('clientsList')) {
                        clientsList = JSON.parse(localStorage.getItem('clientsList')).data;
                        $http.get('/api/clients')
                                .success(function (response) {
                                    if (!localStorage.getItem('clientsList').date) {

                                    }
                                    if (response.date >= JSON.parse(localStorage.getItem('clientsList')).date) {
                                        clientsList = response.data;
                                        localStorage.setItem('clientsList', JSON.stringify(response));
                                        $rootScope.$broadcast('newClientList', {clientsList: clientsList});
                                    } else {
                                        // handle scenario when local version is newer
                                        console.log('here', response.date, JSON.parse(localStorage.getItem('clientsList')).date);
                                    }
                                })
                                .error(function () {
                                });
                    } else {
                        $http.get('/api/clients')
                                .success(function (response) {
                                    clientsList = response.data;
                                    localStorage.setItem('clientsList', JSON.stringify(response));
                                    $rootScope.$broadcast('newClientList', {clientsList: clientsList});
                                })
                                .error(function () {
                                });
                    }
                },
                addClient: function (client) {
                    $http.post('/api/clients', client).then(function (response) {
                        clientsList.push(response.data);
                        localStorage.setItem('clientsList', JSON.stringify({data: clientsList, date: new Date().getTime()}));
 $rootScope.$broadcast('newClientList', {clientsList: clientsList});
                        commonFunctions.customAlert("Thank you for registering with GROOM Barbers");
                    },
                            function () {
                                $rootScope.$broadcast('AddClientFailure', function () {
                                });
                            });
                },
                updateClient: function (client) {
                    for (var i = 0; i < clientsList.length; i++) {
                        if (client.id === clientsList[i].id) {
                            client._id = clientsList[i]._id;
                            clientsList[i] = client;
                            localStorage.setItem('clientsList', JSON.stringify({data: clientsList, date: new Date().getTime()}));
                            $http.post('/api/clients', client).then(function () {
                            });
                        }
                    }
                },
                getClient: function (clientId) {
                    for (var i = 0; i < clientsList.length; i++) {
                        if (clientId === clientsList[i].id) {
                            clientsList[i].createdOn = new Date(clientsList[i].createdOn);
                            clientsList[i].lastVisit = new Date(clientsList[i].lastVisit);
                            clientsList[i].counters.visits = Number(clientsList[i].counters.visits);
                            clientsList[i].counters.progress = Number(clientsList[i].counters.progress);
                            return clientsList[i];
                        }
                    }
                },
                lastVisitInAnHour: function (client) {
                    if (new Date(client.lastVisit).getFullYear() === new Date().getFullYear()
                            && new Date(client.lastVisit).getMonth() === new Date().getMonth()
                            && new Date(client.lastVisit).getDate() === new Date().getDate()
                            && new Date(client.lastVisit).getHours() === new Date().getHours()) {
                        return true;
                    } else {
                        return false;
                    }
                },
                findClientByQrCode: function (tokenNumber, clientList) {
                    for (var i = 0, l = clientList.length; i < l; i++) {
                        if (tokenNumber === clientList[i].tokenNumber) {
                            return clientList[i];
                        }
                    }
                    return false;
                },
                getClientById: function (id, clientList) {
                    for (var i = 0, l = clientList.length; i < l; i++) {
                        if (id === clientList[i].id) {
                            return clientList[i];
                        }
                    }
                    return false;
                },
                saveClient: function (client, clientList) {
                    var defer = $q.defer();
                    for (var i = 0, l = clientList.length; i < l; i++) {
                        if (client.id === clientList[i].id) {
                            clientList[i] = client;
                            $http.post('/api/clients', client).then(function () {
                                defer.resolve(client);
                            }, function () {
                                defer.reject();
                            });
                        }
                        return defer.promise;
                    }
                    return false;
                },
                findClientIndex: function (id, clientList) {
                    for (var i = 0, l = clientList.length; i < l; i++) {
                        if (id === clientList[i].id) {
                            return i;
                        }
                    }
                    return false;
                },
                getAnonymousClient: function (clientList) {
                    for (var i = 0, l = clientList.length; i < l; i++) {
                        if ('Casual Customer' === clientList[i].name) {
                            return clientList[i];
                        }
                    }
                    return false;
                }
            };
        })
        .factory('productsService', function ($http, $rootScope) {
            var products = [];
            return {
                getProducts: function () {
                    return products;
                },
                initProducts: function () {
                    $http.get('/api/products')
                            .success(function (response) {
                                products = response;
                                localStorage.setItem('products', JSON.stringify(products));
                                $rootScope.$broadcast('newProductsList', {products: products})
                            })
                            .error(function () {
                            });
                    products = JSON.parse(localStorage.getItem('products'));
                },
                saveProduct: function (product) {

                }
            };
        })
        .factory('staffService', function ($http, $rootScope) {
            var staffList = [];
            return {
                getStaffList: function () {
                    return staffList;
                },
                staffListInit: function () {
                    $http.get('/api/staff')
                            .success(function (response) {
                                staffList = response;
                                localStorage.setItem('staffList', JSON.stringify(staffList));
                                $rootScope.$broadcast('newProductsList', {staffList: staffList});
                            })
                            .error(function () {
                            });
                    staffList = JSON.parse(localStorage.getItem('staffList'));
                },
                saveStaffMember: function (staffList) {

                }
            };
        })
        .factory('storeService', function ($http, $rootScope) {
            var storeList = [];
            return {
                getStoreList: function () {
                    return storeList;
                },
                storeListInit: function () {
                    $http.get('/api/users')
                            .success(function (response) {
                                storeList = response;
                                localStorage.setItem('storeList', JSON.stringify(storeList));
                                $rootScope.$broadcast('newStoreList', {storeList: storeList});
                            })
                            .error(function () {
                            });
                    storeList = JSON.parse(localStorage.getItem('storeList'));
                },
                saveStore: function (storeList) {

                }
            };
        })
        .factory('visitsService', function ($http, $rootScope) {
            var visitsList = [];
            return {
                getVisits: function () {
                    return visitsList;
                },
                visitsInit: function () {
                    $http.get('/api/visits')
                            .success(function (response) {
                                visitsList = response;
                                localStorage.setItem('visitsList', JSON.stringify(visitsList));
                                $rootScope.$broadcast('newVisitsList', {visitsList: visitsList});
                            })
                            .error(function () {
                            });
                    visitsList = JSON.parse(localStorage.getItem('visitsList'));
                },
                addVisit: function (visit) {
                    visitsList.push(visit);
                    localStorage.setItem('visitsList', JSON.stringify(visitsList));
                    $rootScope.$broadcast('newVisitsList', {visitsList: visitsList});
                }
            };
        })


        .run(['$rootScope', 'AUTH_EVENTS', 'AuthService', '$location',
            function ($rootScope, AUTH_EVENTS, AuthService, $location) {

                $rootScope.$on('$routeChangeStart', function (event, next) {
                    // redirect to login page if not logged in
                    if (next.data && next.data.authorizedRoles) {
                        var authorizedRoles = next.data.authorizedRoles;
                        if (!AuthService.isAuthorized(authorizedRoles)) {
                            event.preventDefault();
                            if (AuthService.isAuthenticated()) {
                                // user is not allowed
                                $rootScope.$broadcast(AUTH_EVENTS.notAuthorized);
                            } else {
                                // user is not logged in
                                $rootScope.$broadcast(AUTH_EVENTS.notAuthenticated);
                                $location.path('/login');
                            }
                        }
                    }
                });
            }]);
angular.module('myApp.constants', [])
        .constant("DEFAULT_SETTINGS", {
            numberVisits: 6,
            winMessage: "HALF PRICE HAIR CUT",
            defaultPrice: "30",
            storeId: '123',
            productExpiration: '42'
        })
        .constant('AUTH_EVENTS', {
            loginSuccess: 'auth-login-success',
            loginFailed: 'auth-login-failed',
            logoutSuccess: 'auth-logout-success',
            sessionTimeout: 'auth-session-timeout',
            notAuthenticated: 'auth-not-authenticated',
            notAuthorized: 'auth-not-authorized'
        })
        .constant('USER_ROLES', {
            all: '*',
            user: 'user',
            admin: 'admin'
        })
        .constant('appConfig', {
            //            DbId: 'FZppyrqd2WJkyAr7bLk0LVGbpD6Mug0L',
            //            DbPath: 'hwhl/collections/',
            DbId: 'FZppyrqd2WJkyAr7bLk0LVGbpD6Mug0L',
            DbPath: 'hwhl_dev/collections/',
            DbUrl: 'https://api.mongolab.com/api/1/databases/',
            MsgSvcWebsite: 'http://api.clickatell.com/http/sendmsg',
            MsgSvcUser: 'alexey0511',
            MsgSvcPwd: 'REHFEfEQEVBPPF',
            MsgSvcApiId: '3513880'
        });

