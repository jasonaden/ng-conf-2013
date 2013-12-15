(function () {
    'use strict';

    angular.module('ngConf2013App')
        .directive('input', function () {
            return {
                restrict: 'E',
                require: '?ngModel',
                link: function (scope, element, attr, ctrl) {
                    if (ctrl) {
                        var listener = noop;
                        element.on('input', listener);
                    }
                }
            };
        })
        .directive('ngModel', function () {
            return {
                require: ['ngModel', '^?form'],
                controller: ['$scope', '$exceptionHandler', '$attrs', '$element', '$parse',
                    function ($scope, $exceptionHandler, $attr, $element, $parse) {
                        this.$viewValue = Number.NaN;
                        this.$modelValue = Number.NaN;

                        var ngModelGet = $parse($attr.ngModel),
                            ngModelSet = ngModelGet.assign;

                        this.$render = noop;

                        this.$setViewValue = noop;

                    }]
            }
        });


















































    // Taken from angularjs source to have variables available locally
    var SNAKE_CASE_REGEXP = /[A-Z]/g;

    function snake_case(name, separator) {
        separator = separator || '_';
        return name.replace(SNAKE_CASE_REGEXP, function (letter, pos) {
            return (pos ? separator : '') + letter.toLowerCase();
        });
    }

    function int(str) {
        return parseInt(str, 10);
    }

    function startingTag(element) {
        element = angular.element(element).clone();
        try {
            // turns out IE does not let you set .html() on elements which
            // are not allowed to have children. So we just ignore it.
            element.html('');
        } catch (e) {
        }
        // As Per DOM Standards
        var TEXT_NODE = 3;
        var elemHtml = angular.element('<div>').append(element).html();
        try {
            return element[0].nodeType === TEXT_NODE ? lowercase(elemHtml) :
                elemHtml.
                    match(/^(<[^>]+>)/)[1].
                    replace(/^<([\w\-]+)/, function (match, nodeName) {
                        return '<' + lowercase(nodeName);
                    });
        } catch (e) {
            return lowercase(elemHtml);
        }

    }

    function toBoolean(value) {
        if (value && value.length !== 0) {
            var v = lowercase("" + value);
            value = !(v == 'f' || v == '0' || v == 'false' || v == 'no' || v == 'n' || v == '[]');
        } else {
            value = false;
        }
        return value;
    }

    var trim = (function() {
        // native trim is way faster: http://jsperf.com/angular-trim-test
        // but IE doesn't have it... :-(
        // TODO: we should move this into IE/ES5 polyfill
        if (!String.prototype.trim) {
            return function(value) {
                return isString(value) ? value.replace(/^\s\s*/, '').replace(/\s\s*$/, '') : value;
            };
        }
        return function(value) {
            return isString(value) ? value.trim() : value;
        };
    })();

    var noop = angular.noop,
        isUndefined = angular.isUndefined,
        isString = angular.isString,
        forEach = angular.forEach,
        lowercase = angular.lowercase;
    var VALID_CLASS = 'ng-valid',
        INVALID_CLASS = 'ng-invalid',
        PRISTINE_CLASS = 'ng-pristine',
        DIRTY_CLASS = 'ng-dirty';
    var nullFormCtrl = {
        $addControl: noop,
        $removeControl: noop,
        $setValidity: noop,
        $setDirty: noop,
        $setPristine: noop
    };

})()