'use strict';

angular.module('ngConf2013App')
    .controller('MainCtrl', function ($scope) {
        this.myVariable = 'Model Value!';
        this.changes = 0;
        this.itRan = function () {
            this.changes++;
        }
    });
