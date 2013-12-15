(function () {
    'use strict';

    angular.module('ngConf2013App')
        .directive('input', ['$browser', '$sniffer', function ($browser, $sniffer) {
            return {
                restrict: 'E',
                require: '?ngModel',
                link: function (scope, element, attr, ctrl) {
                    if (ctrl) {
// In composition mode, users are still inputing intermediate text buffer,
                        // hold the listener until composition is done.
                        // More about composition events: https://developer.mozilla.org/en-US/docs/Web/API/CompositionEvent
                        var composing = false;

                        element.on('compositionstart', function () {
                            composing = true;
                        });

                        element.on('compositionend', function () {
                            composing = false;
                        });

                        var listener = function () {
                            if (composing) return;
                            var value = element.val();

                            // By default we will trim the value
                            // If the attribute ng-trim exists we will avoid trimming
                            // e.g. <input ng-model="foo" ng-trim="false">
                            if (toBoolean(attr.ngTrim || 'T')) {
                                value = trim(value);
                            }

                            if (ctrl.$viewValue !== value) {
                                scope.$apply(function () {
                                    ctrl.$setViewValue(value);
                                });
                            }
                        };

                        // if the browser does support "input" event, we are fine - except on IE9 which doesn't fire the
                        // input event on backspace, delete or cut
                        if ($sniffer.hasEvent('input')) {
                            element.on('input', listener);
                        } else {
                            var timeout;

                            var deferListener = function () {
                                if (!timeout) {
                                    timeout = $browser.defer(function () {
                                        listener();
                                        timeout = null;
                                    });
                                }
                            };

                            element.on('keydown', function (event) {
                                var key = event.keyCode;

                                // ignore
                                //    command            modifiers                   arrows
                                if (key === 91 || (15 < key && key < 19) || (37 <= key && key <= 40)) return;

                                deferListener();
                            });

                            // if user modifies input value using context menu in IE, we need "paste" and "cut" events to catch it
                            if ($sniffer.hasEvent('paste')) {
                                element.on('paste cut', deferListener);
                            }
                        }

                        // if user paste into input using mouse on older browser
                        // or form autocomplete on newer browser, we need "change" event to catch it
                        element.on('change', listener);

                        ctrl.$render = function () {
                            element.val(ctrl.$isEmpty(ctrl.$viewValue) ? '' : ctrl.$viewValue);
                        };

                        // pattern validator
                        var pattern = attr.ngPattern,
                            patternValidator,
                            match;

                        var validate = function (regexp, value) {
                            if (ctrl.$isEmpty(value) || regexp.test(value)) {
                                ctrl.$setValidity('pattern', true);
                                return value;
                            } else {
                                ctrl.$setValidity('pattern', false);
                                return undefined;
                            }
                        };

                        if (pattern) {
                            match = pattern.match(/^\/(.*)\/([gim]*)$/);
                            if (match) {
                                pattern = new RegExp(match[1], match[2]);
                                patternValidator = function (value) {
                                    return validate(pattern, value);
                                };
                            } else {
                                patternValidator = function (value) {
                                    var patternObj = scope.$eval(pattern);

                                    if (!patternObj || !patternObj.test) {
                                        throw minErr('ngPattern')('noregexp',
                                            'Expected {0} to be a RegExp but was {1}. Element: {2}', pattern,
                                            patternObj, startingTag(element));
                                    }
                                    return validate(patternObj, value);
                                };
                            }

                            ctrl.$formatters.push(patternValidator);
                            ctrl.$parsers.push(patternValidator);
                        }

                        // min length validator
                        if (attr.ngMinlength) {
                            var minlength = int(attr.ngMinlength);
                            var minLengthValidator = function (value) {
                                if (!ctrl.$isEmpty(value) && value.length < minlength) {
                                    ctrl.$setValidity('minlength', false);
                                    return undefined;
                                } else {
                                    ctrl.$setValidity('minlength', true);
                                    return value;
                                }
                            };

                            ctrl.$parsers.push(minLengthValidator);
                            ctrl.$formatters.push(minLengthValidator);
                        }

                        // max length validator
                        if (attr.ngMaxlength) {
                            var maxlength = int(attr.ngMaxlength);
                            var maxLengthValidator = function (value) {
                                if (!ctrl.$isEmpty(value) && value.length > maxlength) {
                                    ctrl.$setValidity('maxlength', false);
                                    return undefined;
                                } else {
                                    ctrl.$setValidity('maxlength', true);
                                    return value;
                                }
                            };

                            ctrl.$parsers.push(maxLengthValidator);
                            ctrl.$formatters.push(maxLengthValidator);
                        }
                    }
                }
            };
        }])
        .directive('ngModel', function () {
            return {
                require: ['ngModel', '^?form'],
                controller: ['$scope', '$exceptionHandler', '$attrs', '$element', '$parse',
                    function ($scope, $exceptionHandler, $attr, $element, $parse) {
                        this.$viewValue = Number.NaN;
                        this.$modelValue = Number.NaN;
                        this.$parsers = [];
                        this.$formatters = [];
                        this.$viewChangeListeners = [];
                        this.$pristine = true;
                        this.$dirty = false;
                        this.$valid = true;
                        this.$invalid = false;
                        this.$name = $attr.name;

                        var ngModelGet = $parse($attr.ngModel),
                            ngModelSet = ngModelGet.assign;

                        if (!ngModelSet) {
                            throw minErr('ngModel')('nonassign', "Expression '{0}' is non-assignable. Element: {1}",
                                $attr.ngModel, startingTag($element));
                        }

                        /**
                         * @ngdoc function
                         * @name ng.directive:ngModel.NgModelController#$render
                         * @methodOf ng.directive:ngModel.NgModelController
                         *
                         * @description
                         * Called when the view needs to be updated. It is expected that the user of the ng-model
                         * directive will implement this method.
                         */
                        this.$render = noop;

                        /**
                         * @ngdoc function
                         * @name { ng.directive:ngModel.NgModelController#$isEmpty
                         * @methodOf ng.directive:ngModel.NgModelController
                         *
                         * @description
                         * This is called when we need to determine if the value of the input is empty.
                         *
                         * For instance, the required directive does this to work out if the input has data or not.
                         * The default `$isEmpty` function checks whether the value is `undefined`, `''`, `null` or `NaN`.
                         *
                         * You can override this for input directives whose concept of being empty is different to the
                         * default. The `checkboxInputType` directive does this because in its case a value of `false`
                         * implies empty.
                         */
                        this.$isEmpty = function (value) {
                            return isUndefined(value) || value === '' || value === null || value !== value;
                        };

                        var parentForm = $element.inheritedData('$formController') || nullFormCtrl,
                            invalidCount = 0, // used to easily determine if we are valid
                            $error = this.$error = {}; // keep invalid keys here


                        // Setup initial state of the control
                        $element.addClass(PRISTINE_CLASS);
                        toggleValidCss(true);

                        // convenience method for easy toggling of classes
                        function toggleValidCss(isValid, validationErrorKey) {
                            validationErrorKey = validationErrorKey ? '-' + snake_case(validationErrorKey, '-') : '';
                            $element.
                                removeClass((isValid ? INVALID_CLASS : VALID_CLASS) + validationErrorKey).
                                addClass((isValid ? VALID_CLASS : INVALID_CLASS) + validationErrorKey);
                        }

                        /**
                         * @ngdoc function
                         * @name ng.directive:ngModel.NgModelController#$setValidity
                         * @methodOf ng.directive:ngModel.NgModelController
                         *
                         * @description
                         * Change the validity state, and notifies the form when the control changes validity. (i.e. it
                         * does not notify form if given validator is already marked as invalid).
                         *
                         * This method should be called by validators - i.e. the parser or formatter functions.
                         *
                         * @param {string} validationErrorKey Name of the validator. the `validationErrorKey` will assign
                         *        to `$error[validationErrorKey]=isValid` so that it is available for data-binding.
                         *        The `validationErrorKey` should be in camelCase and will get converted into dash-case
                         *        for class name. Example: `myError` will result in `ng-valid-my-error` and `ng-invalid-my-error`
                         *        class and can be bound to as  `{{someForm.someControl.$error.myError}}` .
                         * @param {boolean} isValid Whether the current state is valid (true) or invalid (false).
                         */
                        this.$setValidity = function (validationErrorKey, isValid) {
                            // Purposeful use of ! here to cast isValid to boolean in case it is undefined
                            // jshint -W018
                            if ($error[validationErrorKey] === !isValid) return;
                            // jshint +W018

                            if (isValid) {
                                if ($error[validationErrorKey]) invalidCount--;
                                if (!invalidCount) {
                                    toggleValidCss(true);
                                    this.$valid = true;
                                    this.$invalid = false;
                                }
                            } else {
                                toggleValidCss(false);
                                this.$invalid = true;
                                this.$valid = false;
                                invalidCount++;
                            }

                            $error[validationErrorKey] = !isValid;
                            toggleValidCss(isValid, validationErrorKey);

                            parentForm.$setValidity(validationErrorKey, isValid, this);
                        };

                        /**
                         * @ngdoc function
                         * @name ng.directive:ngModel.NgModelController#$setPristine
                         * @methodOf ng.directive:ngModel.NgModelController
                         *
                         * @description
                         * Sets the control to its pristine state.
                         *
                         * This method can be called to remove the 'ng-dirty' class and set the control to its pristine
                         * state (ng-pristine class).
                         */
                        this.$setPristine = function () {
                            this.$dirty = false;
                            this.$pristine = true;
                            $element.removeClass(DIRTY_CLASS).addClass(PRISTINE_CLASS);
                        };

                        /**
                         * @ngdoc function
                         * @name ng.directive:ngModel.NgModelController#$setViewValue
                         * @methodOf ng.directive:ngModel.NgModelController
                         *
                         * @description
                         * Update the view value.
                         *
                         * This method should be called when the view value changes, typically from within a DOM event handler.
                         * For example {@link ng.directive:input input} and
                         * {@link ng.directive:select select} directives call it.
                         *
                         * It will update the $viewValue, then pass this value through each of the functions in `$parsers`,
                         * which includes any validators. The value that comes out of this `$parsers` pipeline, be applied to
                         * `$modelValue` and the **expression** specified in the `ng-model` attribute.
                         *
                         * Lastly, all the registered change listeners, in the `$viewChangeListeners` list, are called.
                         *
                         * Note that calling this function does not trigger a `$digest`.
                         *
                         * @param {string} value Value from the view.
                         */
                        this.$setViewValue = function (value) {
                            this.$viewValue = value;

                            // change to dirty
                            if (this.$pristine) {
                                this.$dirty = true;
                                this.$pristine = false;
                                $element.removeClass(PRISTINE_CLASS).addClass(DIRTY_CLASS);
                                parentForm.$setDirty();
                            }

                            forEach(this.$parsers, function (fn) {
                                value = fn(value);
                            });

                            if (this.$modelValue !== value) {
                                this.$modelValue = value;
                                ngModelSet($scope, value);
                                forEach(this.$viewChangeListeners, function (listener) {
                                    try {
                                        listener();
                                    } catch (e) {
                                        $exceptionHandler(e);
                                    }
                                });
                            }
                        };

                        // model -> value
                        var ctrl = this;

                        $scope.$watch(function ngModelWatch() {
                            var value = ngModelGet($scope);

                            // if scope model value and ngModel value are out of sync
                            if (ctrl.$modelValue !== value) {

                                var formatters = ctrl.$formatters,
                                    idx = formatters.length;

                                ctrl.$modelValue = value;
                                while (idx--) {
                                    value = formatters[idx](value);
                                }

                                if (ctrl.$viewValue !== value) {
                                    ctrl.$viewValue = value;
                                    ctrl.$render();
                                }
                            }

                            return value;
                        });
                    }],
                link: function (scope, element, attr, ctrls) {
                    // notify others, especially parent forms

                    var modelCtrl = ctrls[0],
                        formCtrl = ctrls[1] || nullFormCtrl;

                    formCtrl.$addControl(modelCtrl);

                    scope.$on('$destroy', function () {
                        formCtrl.$removeControl(modelCtrl);
                    })
                }
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