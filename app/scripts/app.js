'use strict';

angular.module('ngConf2013App', [
        'ngRoute'
    ])
    .config(function ($routeProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'views/main.html'
            })
            .otherwise({
                redirectTo: '/'
            });
    });
