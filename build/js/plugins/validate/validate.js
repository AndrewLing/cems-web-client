
/*! jQuery Validation Plugin - v1.13.0 - 7/1/2014
 * http://jqueryvalidation.org/
 * Copyright (c) 2014 Jörn Zaefferer; Licensed MIT */
!
    function (a) {
        "function" == typeof define && define.amd ? define(["jquery"], a) : a(jQuery)
    }(function (a) {
        a.extend(a.fn, {
            validate: function (b) {
                if (!this.length) return void(b && b.debug && window.console && console.warn("Nothing selected, can't validate, returning nothing."));
                var c = a.data(this[0], "validator");
                return c ? c : (this.attr("novalidate", "novalidate"), c = new a.validator(b, this[0]), a.data(this[0], "validator", c), c.settings.onsubmit && (this.validateDelegate(":submit", "click", function (b) {
                    c.settings.submitHandler && (c.submitButton = b.target), a(b.target).hasClass("cancel") && (c.cancelSubmit = !0), void 0 !== a(b.target).attr("formnovalidate") && (c.cancelSubmit = !0)
                }), this.submit(function (b) {
                    function d() {
                        var d;
                        return c.settings.submitHandler ? (c.submitButton && (d = a("<input type='hidden'/>").attr("name", c.submitButton.name).val(a(c.submitButton).val()).appendTo(c.currentForm)), c.settings.submitHandler.call(c, c.currentForm, b), c.submitButton && d.remove(), !1) : !0
                    }

                    return c.settings.debug && b.preventDefault(), c.cancelSubmit ? (c.cancelSubmit = !1, d()) : c.form() ? c.pendingRequest ? (c.formSubmitted = !0, !1) : d() : (c.focusInvalid(), !1)
                })), c)
            },
            valid: function () {
                var b, c;
                return a(this[0]).is("form") ? b = this.validate().form() : (b = !0, c = a(this[0].form).validate(), this.each(function () {
                    b = c.element(this) && b
                })), b
            },
            removeAttrs: function (b) {
                var c = {},
                    d = this;
                return a.each(b.split(/\s/), function (a, b) {
                    c[b] = d.attr(b), d.removeAttr(b)
                }), c
            },
            rules: function (b, c) {
                var d, e, f, g, h, i, j = this[0];
                if (b) switch (d = a.data(j.form, "validator").settings, e = d.rules, f = a.validator.staticRules(j), b) {
                    case "add":
                        a.extend(f, a.validator.normalizeRule(c)), delete f.messages, e[j.name] = f, c.messages && (d.messages[j.name] = a.extend(d.messages[j.name], c.messages));
                        break;
                    case "remove":
                        return c ? (i = {}, a.each(c.split(/\s/), function (b, c) {
                            i[c] = f[c], delete f[c], "required" === c && a(j).removeAttr("aria-required")
                        }), i) : (delete e[j.name], f)
                }
                return g = a.validator.normalizeRules(a.extend({}, a.validator.classRules(j), a.validator.attributeRules(j), a.validator.dataRules(j), a.validator.staticRules(j)), j), g.required && (h = g.required, delete g.required, g = a.extend({
                    required: h
                }, g), a(j).attr("aria-required", "true")), g.remote && (h = g.remote, delete g.remote, g = a.extend(g, {
                    remote: h
                })), g
            }
        }), a.extend(a.expr[":"], {
            blank: function (b) {
                return !a.trim("" + a(b).val())
            },
            filled: function (b) {
                return !!a.trim("" + a(b).val())
            },
            unchecked: function (b) {
                return !a(b).prop("checked")
            }
        }), a.validator = function (b, c) {
            this.settings = a.extend(!0, {}, a.validator.defaults, b), this.currentForm = c, this.init()
        }, a.validator.format = function (b, c) {
            return 1 === arguments.length ?
                function () {
                    var c = a.makeArray(arguments);
                    return c.unshift(b), a.validator.format.apply(this, c)
                } : (arguments.length > 2 && c.constructor !== Array && (c = a.makeArray(arguments).slice(1)), c.constructor !== Array && (c = [c]), a.each(c, function (a, c) {
                b = b.replace(new RegExp("\\{" + a + "\\}", "g"), function () {
                    return c
                })
            }), b)
        }, a.extend(a.validator, {
            defaults: {
                messages: {},
                groups: {},
                rules: {},
                errorClass: "error",
                validClass: "valid",
                errorElement: "label",
                focusInvalid: !0,
                errorContainer: a([]),
                errorLabelContainer: a([]),
                onsubmit: !0,
                ignore: ":hidden",
                ignoreTitle: !1,
                onfocusin: function (a) {
                    this.lastActive = a, this.settings.focusCleanup && !this.blockFocusCleanup && (this.settings.unhighlight && this.settings.unhighlight.call(this, a, this.settings.errorClass, this.settings.validClass), this.hideThese(this.errorsFor(a)))
                },
                onfocusout: function (a) {
                    this.checkable(a) || !(a.name in this.submitted) && this.optional(a) || this.element(a)
                },
                onkeyup: function (a, b) {
                    (9 !== b.which || "" !== this.elementValue(a)) && (a.name in this.submitted || a === this.lastElement) && this.element(a)
                },
                onclick: function (a) {
                    a.name in this.submitted ? this.element(a) : a.parentNode.name in this.submitted && this.element(a.parentNode)
                },
                highlight: function (b, c, d) {
                    "radio" === b.type ? this.findByName(b.name).addClass(c).removeClass(d) : a(b).addClass(c).removeClass(d)
                },
                unhighlight: function (b, c, d) {
                    "radio" === b.type ? this.findByName(b.name).removeClass(c).addClass(d) : a(b).removeClass(c).addClass(d)
                }
            },
            setDefaults: function (b) {
                a.extend(a.validator.defaults, b)
            },
            messages: {
                required: "This field is required.",
                remote: "Please fix this field.",
                email: "Please enter a valid email address.",
                url: "Please enter a valid URL.",
                date: "Please enter a valid date.",
                dateISO: "Please enter a valid date ( ISO ).",
                number: "Please enter a valid number.",
                digits: "Please enter only digits.",
                creditcard: "Please enter a valid credit card number.",
                equalTo: "Please enter the same value again.",
                maxlength: a.validator.format("Please enter no more than {0} characters."),
                minlength: a.validator.format("Please enter at least {0} characters."),
                rangelength: a.validator.format("Please enter a value between {0} and {1} characters long."),
                range: a.validator.format("Please enter a value between {0} and {1}."),
                max: a.validator.format("Please enter a value less than or equal to {0}."),
                min: a.validator.format("Please enter a value greater than or equal to {0}.")
            },
            autoCreateRanges: !1,
            prototype: {
                init: function () {
                    function b(b) {
                        var c = a.data(this[0].form, "validator"),
                            d = "on" + b.type.replace(/^validate/, ""),
                            e = c.settings;
                        e[d] && !this.is(e.ignore) && e[d].call(c, this[0], b)
                    }

                    this.labelContainer = a(this.settings.errorLabelContainer), this.errorContext = this.labelContainer.length && this.labelContainer || a(this.currentForm), this.containers = a(this.settings.errorContainer).add(this.settings.errorLabelContainer), this.submitted = {}, this.valueCache = {}, this.pendingRequest = 0, this.pending = {}, this.invalid = {}, this.reset();
                    var c, d = this.groups = {};
                    a.each(this.settings.groups, function (b, c) {
                        "string" == typeof c && (c = c.split(/\s/)), a.each(c, function (a, c) {
                            d[c] = b
                        })
                    }), c = this.settings.rules, a.each(c, function (b, d) {
                        c[b] = a.validator.normalizeRule(d)
                    }), a(this.currentForm).validateDelegate(":text, [type='password'], [type='file'], select, textarea, [type='number'], [type='search'] ,[type='tel'], [type='url'], [type='email'], [type='datetime'], [type='date'], [type='month'], [type='week'], [type='time'], [type='datetime-local'], [type='range'], [type='color'], [type='radio'], [type='checkbox']", "focusin focusout keyup", b).validateDelegate("select, option, [type='radio'], [type='checkbox']", "click", b), this.settings.invalidHandler && a(this.currentForm).bind("invalid-form.validate", this.settings.invalidHandler), a(this.currentForm).find("[required], [data-rule-required], .required").attr("aria-required", "true")
                },
                form: function () {
                    return this.checkForm(), a.extend(this.submitted, this.errorMap), this.invalid = a.extend({}, this.errorMap), this.valid() || a(this.currentForm).triggerHandler("invalid-form", [this]), this.showErrors(), this.valid()
                },
                checkForm: function () {
                    this.prepareForm();
                    for (var a = 0, b = this.currentElements = this.elements(); b[a]; a++) this.check(b[a]);
                    return this.valid()
                },
                element: function (b) {
                    var c = this.clean(b),
                        d = this.validationTargetFor(c),
                        e = !0;
                    return this.lastElement = d, void 0 === d ? delete this.invalid[c.name] : (this.prepareElement(d), this.currentElements = a(d), e = this.check(d) !== !1, e ? delete this.invalid[d.name] : this.invalid[d.name] = !0), a(b).attr("aria-invalid", !e), this.numberOfInvalids() || (this.toHide = this.toHide.add(this.containers)), this.showErrors(), e
                },
                showErrors: function (b) {
                    if (b) {
                        a.extend(this.errorMap, b), this.errorList = [];
                        for (var c in b) this.errorList.push({
                            message: b[c],
                            element: this.findByName(c)[0]
                        });
                        this.successList = a.grep(this.successList, function (a) {
                            return !(a.name in b)
                        })
                    }
                    this.settings.showErrors ? this.settings.showErrors.call(this, this.errorMap, this.errorList) : this.defaultShowErrors()
                },
                resetForm: function () {
                    a.fn.resetForm && a(this.currentForm).resetForm(), this.submitted = {}, this.lastElement = null, this.prepareForm(), this.hideErrors(), this.elements().removeClass(this.settings.errorClass).removeData("previousValue").removeAttr("aria-invalid")
                },
                numberOfInvalids: function () {
                    return this.objectLength(this.invalid)
                },
                objectLength: function (a) {
                    var b, c = 0;
                    for (b in a) c++;
                    return c
                },
                hideErrors: function () {
                    this.hideThese(this.toHide)
                },
                hideThese: function (a) {
                    a.not(this.containers).text(""), this.addWrapper(a).hide()
                },
                valid: function () {
                    return 0 === this.size()
                },
                size: function () {
                    return this.errorList.length
                },
                focusInvalid: function () {
                    if (this.settings.focusInvalid) try {
                        a(this.findLastActive() || this.errorList.length && this.errorList[0].element || []).filter(":visible").focus().trigger("focusin")
                    } catch (b) {
                    }
                },
                findLastActive: function () {
                    var b = this.lastActive;
                    return b && 1 === a.grep(this.errorList, function (a) {
                        return a.element.name === b.name
                    }).length && b
                },
                elements: function () {
                    var b = this,
                        c = {};
                    return a(this.currentForm).find("input, select, textarea").not(":submit, :reset, :image, [disabled]").not(this.settings.ignore).filter(function () {
                        return !this.name && b.settings.debug && window.console && console.error("%o has no name assigned", this), this.name in c || !b.objectLength(a(this).rules()) ? !1 : (c[this.name] = !0, !0)
                    })
                },
                clean: function (b) {
                    return a(b)[0]
                },
                errors: function () {
                    var b = this.settings.errorClass.split(" ").join(".");
                    return a(this.settings.errorElement + "." + b, this.errorContext)
                },
                reset: function () {
                    this.successList = [], this.errorList = [], this.errorMap = {}, this.toShow = a([]), this.toHide = a([]), this.currentElements = a([])
                },
                prepareForm: function () {
                    this.reset(), this.toHide = this.errors().add(this.containers)
                },
                prepareElement: function (a) {
                    this.reset(), this.toHide = this.errorsFor(a)
                },
                elementValue: function (b) {
                    var c, d = a(b),
                        e = b.type;
                    return "radio" === e || "checkbox" === e ? a("input[name='" + b.name + "']:checked").val() : "number" === e && "undefined" != typeof b.validity ? b.validity.badInput ? !1 : d.val() : (c = d.val(), "string" == typeof c ? c.replace(/\r/g, "") : c)
                },
                check: function (b) {
                    b = this.validationTargetFor(this.clean(b));
                    var c, d, e, f = a(b).rules(),
                        g = a.map(f, function (a, b) {
                            return b
                        }).length,
                        h = !1,
                        i = this.elementValue(b);
                    for (d in f) {
                        e = {
                            method: d,
                            parameters: f[d]
                        };
                        try {
                            if (c = a.validator.methods[d].call(this, i, b, e.parameters), "dependency-mismatch" === c && 1 === g) {
                                h = !0;
                                continue
                            }
                            if (h = !1, "pending" === c) return void(this.toHide = this.toHide.not(this.errorsFor(b)));
                            if (!c) return this.formatAndAdd(b, e), !1
                        } catch (j) {
                            throw this.settings.debug && window.console && console.log("Exception occurred when checking element " + b.id + ", check the '" + e.method + "' method.", j), j
                        }
                    }
                    if (!h) return this.objectLength(f) && this.successList.push(b), !0
                },
                customDataMessage: function (b, c) {
                    return a(b).data("msg" + c.charAt(0).toUpperCase() + c.substring(1).toLowerCase()) || a(b).data("msg")
                },
                customMessage: function (a, b) {
                    var c = this.settings.messages[a];
                    return c && (c.constructor === String ? c : c[b])
                },
                findDefined: function () {
                    for (var a = 0; a < arguments.length; a++) if (void 0 !== arguments[a]) return arguments[a];
                    return void 0
                },
                defaultMessage: function (b, c) {
                    return this.findDefined(this.customMessage(b.name, c), this.customDataMessage(b, c), !this.settings.ignoreTitle && b.title || void 0, a.validator.messages[c], "<strong>Warning: No message defined for " + b.name + "</strong>")
                },
                formatAndAdd: function (b, c) {
                    var d = this.defaultMessage(b, c.method),
                        e = /\$?\{(\d+)\}/g;
                    "function" == typeof d ? d = d.call(this, c.parameters, b) : e.test(d) && (d = a.validator.format(d.replace(e, "{$1}"), c.parameters)), this.errorList.push({
                        message: d,
                        element: b,
                        method: c.method
                    }), this.errorMap[b.name] = d, this.submitted[b.name] = d
                },
                addWrapper: function (a) {
                    return this.settings.wrapper && (a = a.add(a.parent(this.settings.wrapper))), a
                },
                defaultShowErrors: function () {
                    var a, b, c;
                    for (a = 0; this.errorList[a]; a++) c = this.errorList[a], this.settings.highlight && this.settings.highlight.call(this, c.element, this.settings.errorClass, this.settings.validClass), this.showLabel(c.element, c.message);
                    if (this.errorList.length && (this.toShow = this.toShow.add(this.containers)), this.settings.success) for (a = 0; this.successList[a]; a++) this.showLabel(this.successList[a]);
                    if (this.settings.unhighlight) for (a = 0, b = this.validElements(); b[a]; a++) this.settings.unhighlight.call(this, b[a], this.settings.errorClass, this.settings.validClass);
                    this.toHide = this.toHide.not(this.toShow), this.hideErrors(), this.addWrapper(this.toShow).show()
                },
                validElements: function () {
                    return this.currentElements.not(this.invalidElements())
                },
                invalidElements: function () {
                    return a(this.errorList).map(function () {
                        return this.element
                    })
                },
                showLabel: function (b, c) {
                    var d, e, f, g = this.errorsFor(b),
                        h = this.idOrName(b),
                        i = a(b).attr("aria-describedby");
                    g.length ? (g.removeClass(this.settings.validClass).addClass(this.settings.errorClass), g.html(c)) : (g = a("<" + this.settings.errorElement + ">").attr("id", h + "-error").addClass(this.settings.errorClass).html(c || ""), d = g, this.settings.wrapper && (d = g.hide().show().wrap("<" + this.settings.wrapper + "/>").parent()), this.labelContainer.length ? this.labelContainer.append(d) : this.settings.errorPlacement ? this.settings.errorPlacement(d, a(b)) : d.appendTo($(b).parent()), g.is("label") ? g.attr("for", h) : 0 === g.parents("label[for='" + h + "']").length && (f = g.attr("id"), i ? i.match(new RegExp("\b" + f + "\b")) || (i += " " + f) : i = f, a(b).attr("aria-describedby", i), e = this.groups[b.name], e && a.each(this.groups, function (b, c) {
                        c === e && a("[name='" + b + "']", this.currentForm).attr("aria-describedby", g.attr("id"))
                    }))), !c && this.settings.success && (g.text(""), "string" == typeof this.settings.success ? g.addClass(this.settings.success) : this.settings.success(g, b)), this.toShow = this.toShow.add(g)
                },
                errorsFor: function (b) {
                    var c = this.idOrName(b),
                        d = a(b).attr("aria-describedby"),
                        e = "label[for='" + c + "'], label[for='" + c + "'] *";
                    return d && (e = e + ", #" + d.replace(/\s+/g, ", #")), this.errors().filter(e)
                },
                idOrName: function (a) {
                    return this.groups[a.name] || (this.checkable(a) ? a.name : a.id || a.name)
                },
                validationTargetFor: function (a) {
                    return this.checkable(a) && (a = this.findByName(a.name).not(this.settings.ignore)[0]), a
                },
                checkable: function (a) {
                    return /radio|checkbox/i.test(a.type)
                },
                findByName: function (b) {
                    return a(this.currentForm).find("[name='" + b + "']")
                },
                getLength: function (b, c) {
                    switch (c.nodeName.toLowerCase()) {
                        case "select":
                            return a("option:selected", c).length;
                        case "input":
                            if (this.checkable(c)) return this.findByName(c.name).filter(":checked").length
                    }
                    return b.length
                },
                depend: function (a, b) {
                    return this.dependTypes[typeof a] ? this.dependTypes[typeof a](a, b) : !0
                },
                dependTypes: {
                    "boolean": function (a) {
                        return a
                    },
                    string: function (b, c) {
                        return !!a(b, c.form).length
                    },
                    "function": function (a, b) {
                        return a(b)
                    }
                },
                optional: function (b) {
                    var c = this.elementValue(b);
                    return !a.validator.methods.required.call(this, c, b) && "dependency-mismatch"
                },
                startRequest: function (a) {
                    this.pending[a.name] || (this.pendingRequest++, this.pending[a.name] = !0)
                },
                stopRequest: function (b, c) {
                    this.pendingRequest--, this.pendingRequest < 0 && (this.pendingRequest = 0), delete this.pending[b.name], c && 0 === this.pendingRequest && this.formSubmitted && this.form() ? (a(this.currentForm).submit(), this.formSubmitted = !1) : !c && 0 === this.pendingRequest && this.formSubmitted && (a(this.currentForm).triggerHandler("invalid-form", [this]), this.formSubmitted = !1)
                },
                previousValue: function (b) {
                    return a.data(b, "previousValue") || a.data(b, "previousValue", {
                        old: null,
                        valid: !0,
                        message: this.defaultMessage(b, "remote")
                    })
                }
            },
            classRuleSettings: {
                required: {
                    required: !0
                },
                email: {
                    email: !0
                },
                url: {
                    url: !0
                },
                date: {
                    date: !0
                },
                dateISO: {
                    dateISO: !0
                },
                number: {
                    number: !0
                },
                digits: {
                    digits: !0
                },
                creditcard: {
                    creditcard: !0
                }
            },
            addClassRules: function (b, c) {
                b.constructor === String ? this.classRuleSettings[b] = c : a.extend(this.classRuleSettings, b)
            },
            classRules: function (b) {
                var c = {},
                    d = a(b).attr("class");
                return d && a.each(d.split(" "), function () {
                    this in a.validator.classRuleSettings && a.extend(c, a.validator.classRuleSettings[this])
                }), c
            },
            attributeRules: function (b) {
                var c, d, e = {},
                    f = a(b),
                    g = b.getAttribute("type");
                for (c in a.validator.methods)"required" === c ? (d = b.getAttribute(c), "" === d && (d = !0), d = !!d) : d = f.attr(c), /min|max/.test(c) && (null === g || /number|range|text/.test(g)) && (d = Number(d)), d || 0 === d ? e[c] = d : g === c && "range" !== g && (e[c] = !0);
                return e.maxlength && /-1|2147483647|524288/.test(e.maxlength) && delete e.maxlength, e
            },
            dataRules: function (b) {
                var c, d, e = {},
                    f = a(b);
                for (c in a.validator.methods) d = f.data("rule" + c.charAt(0).toUpperCase() + c.substring(1).toLowerCase()), void 0 !== d && (e[c] = d);
                return e
            },
            staticRules: function (b) {
                var c = {},
                    d = a.data(b.form, "validator");
                return d.settings.rules && (c = a.validator.normalizeRule(d.settings.rules[b.name]) || {}), c
            },
            normalizeRules: function (b, c) {
                return a.each(b, function (d, e) {
                    if (e === !1) return void delete b[d];
                    if (e.param || e.depends) {
                        var f = !0;
                        switch (typeof e.depends) {
                            case "string":
                                f = !!a(e.depends, c.form).length;
                                break;
                            case "function":
                                f = e.depends.call(c, c)
                        }
                        f ? b[d] = void 0 !== e.param ? e.param : !0 : delete b[d]
                    }
                }), a.each(b, function (d, e) {
                    b[d] = a.isFunction(e) ? e(c) : e
                }), a.each(["minlength", "maxlength"], function () {
                    b[this] && (b[this] = Number(b[this]))
                }), a.each(["rangelength", "range"], function () {
                    var c;
                    b[this] && (a.isArray(b[this]) ? b[this] = [Number(b[this][0]), Number(b[this][1])] : "string" == typeof b[this] && (c = b[this].replace(/[\[\]]/g, "").split(/[\s,]+/), b[this] = [Number(c[0]), Number(c[1])]))
                }), a.validator.autoCreateRanges && (b.min && b.max && (b.range = [b.min, b.max], delete b.min, delete b.max), b.minlength && b.maxlength && (b.rangelength = [b.minlength, b.maxlength], delete b.minlength, delete b.maxlength)), b
            },
            normalizeRule: function (b) {
                if ("string" == typeof b) {
                    var c = {};
                    a.each(b.split(/\s/), function () {
                        c[this] = !0
                    }), b = c
                }
                return b
            },
            addMethod: function (b, c, d) {
                a.validator.methods[b] = c, a.validator.messages[b] = void 0 !== d ? d : a.validator.messages[b], c.length < 3 && a.validator.addClassRules(b, a.validator.normalizeRule(b))
            },
            methods: {
                required: function (b, c, d) {
                    if (!this.depend(d, c)) return "dependency-mismatch";
                    if ("select" === c.nodeName.toLowerCase()) {
                        var e = a(c).val();
                        return e && e.length > 0
                    }
                    return this.checkable(c) ? this.getLength(b, c) > 0 : a.trim(b).length > 0
                },
                email: function (a, b) {
                    return this.optional(b) || /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(a)
                },
                url: function (a, b) {
                    return this.optional(b) || /^(https?|s?ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(a)
                },
                date: function (a, b) {
                    return this.optional(b) || !/Invalid|NaN/.test(new Date(a).toString())
                },
                dateISO: function (a, b) {
                    return this.optional(b) || /^\d{4}[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])$/.test(a)
                },
                number: function (a, b) {
                    return this.optional(b) || /^-?(?:\d+|\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/.test(a)
                },
                digits: function (a, b) {
                    return this.optional(b) || /^\d+$/.test(a)
                },
                creditcard: function (a, b) {
                    if (this.optional(b)) return "dependency-mismatch";
                    if (/[^0-9 \-]+/.test(a)) return !1;
                    var c, d, e = 0,
                        f = 0,
                        g = !1;
                    if (a = a.replace(/\D/g, ""), a.length < 13 || a.length > 19) return !1;
                    for (c = a.length - 1; c >= 0; c--) d = a.charAt(c), f = parseInt(d, 10), g && (f *= 2) > 9 && (f -= 9), e += f, g = !g;
                    return e % 10 === 0
                },
                minlength: function (b, c, d) {
                    var e = a.isArray(b) ? b.length : this.getLength(a.trim(b), c);
                    return this.optional(c) || e >= d
                },
                maxlength: function (b, c, d) {
                    var e = a.isArray(b) ? b.length : this.getLength(a.trim(b), c);
                    return this.optional(c) || d >= e
                },
                rangelength: function (b, c, d) {
                    var e = a.isArray(b) ? b.length : this.getLength(a.trim(b), c);
                    return this.optional(c) || e >= d[0] && e <= d[1]
                },
                min: function (a, b, c) {
                    return this.optional(b) || a >= c
                },
                max: function (a, b, c) {
                    return this.optional(b) || c >= a
                },
                range: function (a, b, c) {
                    return this.optional(b) || a >= c[0] && a <= c[1]
                },
                equalTo: function (b, c, d) {
                    var e = a(d);
                    return this.settings.onfocusout && e.unbind(".validate-equalTo").bind("blur.validate-equalTo", function () {
                        a(c).valid()
                    }), b === e.val()
                },
                remote: function (b, c, d) {
                    if (this.optional(c)) return "dependency-mismatch";
                    var e, f, g = this.previousValue(c);
                    return this.settings.messages[c.name] || (this.settings.messages[c.name] = {}), g.originalMessage = this.settings.messages[c.name].remote, this.settings.messages[c.name].remote = g.message, d = "string" == typeof d && {
                        url: d
                    } || d, g.old === b ? g.valid : (g.old = b, e = this, this.startRequest(c), f = {}, f[c.name] = b, a.ajax(a.extend(!0, {
                        url: d,
                        mode: "abort",
                        port: "validate" + c.name,
                        dataType: "json",
                        data: f,
                        context: e.currentForm,
                        success: function (d) {
                            var f, h, i, j = d === !0 || "true" === d;
                            e.settings.messages[c.name].remote = g.originalMessage, j ? (i = e.formSubmitted, e.prepareElement(c), e.formSubmitted = i, e.successList.push(c), delete e.invalid[c.name], e.showErrors()) : (f = {}, h = d || e.defaultMessage(c, "remote"), f[c.name] = g.message = a.isFunction(h) ? h(b) : h, e.invalid[c.name] = !0, e.showErrors(f)), g.valid = j, e.stopRequest(c, j)
                        }
                    }, d)), "pending")
                }
            }
        }), a.format = function () {
            throw "$.format has been deprecated. Please use $.validator.format instead."
        };
        var b, c = {};
        a.ajaxPrefilter ? a.ajaxPrefilter(function (a, b, d) {
            var e = a.port;
            "abort" === a.mode && (c[e] && c[e].abort(), c[e] = d)
        }) : (b = a.ajax, a.ajax = function (d) {
            var e = ("mode" in d ? d : a.ajaxSettings).mode,
                f = ("port" in d ? d : a.ajaxSettings).port;
            return "abort" === e ? (c[f] && c[f].abort(), c[f] = b.apply(this, arguments), c[f]) : b.apply(this, arguments)
        }), a.extend(a.fn, {
            validateDelegate: function (b, c, d) {
                return this.bind(c, function (c) {
                    var e = a(c.target);
                    return e.is(b) ? d.apply(e, arguments) : void 0
                })
            }
        })
    });
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3ZhbGlkYXRlL3ZhbGlkYXRlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIlxuLyohIGpRdWVyeSBWYWxpZGF0aW9uIFBsdWdpbiAtIHYxLjEzLjAgLSA3LzEvMjAxNFxuICogaHR0cDovL2pxdWVyeXZhbGlkYXRpb24ub3JnL1xuICogQ29weXJpZ2h0IChjKSAyMDE0IErDtnJuIFphZWZmZXJlcjsgTGljZW5zZWQgTUlUICovXG4hXG4gICAgZnVuY3Rpb24gKGEpIHtcbiAgICAgICAgXCJmdW5jdGlvblwiID09IHR5cGVvZiBkZWZpbmUgJiYgZGVmaW5lLmFtZCA/IGRlZmluZShbXCJqcXVlcnlcIl0sIGEpIDogYShqUXVlcnkpXG4gICAgfShmdW5jdGlvbiAoYSkge1xuICAgICAgICBhLmV4dGVuZChhLmZuLCB7XG4gICAgICAgICAgICB2YWxpZGF0ZTogZnVuY3Rpb24gKGIpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMubGVuZ3RoKSByZXR1cm4gdm9pZChiICYmIGIuZGVidWcgJiYgd2luZG93LmNvbnNvbGUgJiYgY29uc29sZS53YXJuKFwiTm90aGluZyBzZWxlY3RlZCwgY2FuJ3QgdmFsaWRhdGUsIHJldHVybmluZyBub3RoaW5nLlwiKSk7XG4gICAgICAgICAgICAgICAgdmFyIGMgPSBhLmRhdGEodGhpc1swXSwgXCJ2YWxpZGF0b3JcIik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGMgPyBjIDogKHRoaXMuYXR0cihcIm5vdmFsaWRhdGVcIiwgXCJub3ZhbGlkYXRlXCIpLCBjID0gbmV3IGEudmFsaWRhdG9yKGIsIHRoaXNbMF0pLCBhLmRhdGEodGhpc1swXSwgXCJ2YWxpZGF0b3JcIiwgYyksIGMuc2V0dGluZ3Mub25zdWJtaXQgJiYgKHRoaXMudmFsaWRhdGVEZWxlZ2F0ZShcIjpzdWJtaXRcIiwgXCJjbGlja1wiLCBmdW5jdGlvbiAoYikge1xuICAgICAgICAgICAgICAgICAgICBjLnNldHRpbmdzLnN1Ym1pdEhhbmRsZXIgJiYgKGMuc3VibWl0QnV0dG9uID0gYi50YXJnZXQpLCBhKGIudGFyZ2V0KS5oYXNDbGFzcyhcImNhbmNlbFwiKSAmJiAoYy5jYW5jZWxTdWJtaXQgPSAhMCksIHZvaWQgMCAhPT0gYShiLnRhcmdldCkuYXR0cihcImZvcm1ub3ZhbGlkYXRlXCIpICYmIChjLmNhbmNlbFN1Ym1pdCA9ICEwKVxuICAgICAgICAgICAgICAgIH0pLCB0aGlzLnN1Ym1pdChmdW5jdGlvbiAoYikge1xuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBkKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGQ7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYy5zZXR0aW5ncy5zdWJtaXRIYW5kbGVyID8gKGMuc3VibWl0QnV0dG9uICYmIChkID0gYShcIjxpbnB1dCB0eXBlPSdoaWRkZW4nLz5cIikuYXR0cihcIm5hbWVcIiwgYy5zdWJtaXRCdXR0b24ubmFtZSkudmFsKGEoYy5zdWJtaXRCdXR0b24pLnZhbCgpKS5hcHBlbmRUbyhjLmN1cnJlbnRGb3JtKSksIGMuc2V0dGluZ3Muc3VibWl0SGFuZGxlci5jYWxsKGMsIGMuY3VycmVudEZvcm0sIGIpLCBjLnN1Ym1pdEJ1dHRvbiAmJiBkLnJlbW92ZSgpLCAhMSkgOiAhMFxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGMuc2V0dGluZ3MuZGVidWcgJiYgYi5wcmV2ZW50RGVmYXVsdCgpLCBjLmNhbmNlbFN1Ym1pdCA/IChjLmNhbmNlbFN1Ym1pdCA9ICExLCBkKCkpIDogYy5mb3JtKCkgPyBjLnBlbmRpbmdSZXF1ZXN0ID8gKGMuZm9ybVN1Ym1pdHRlZCA9ICEwLCAhMSkgOiBkKCkgOiAoYy5mb2N1c0ludmFsaWQoKSwgITEpXG4gICAgICAgICAgICAgICAgfSkpLCBjKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHZhbGlkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGIsIGM7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGEodGhpc1swXSkuaXMoXCJmb3JtXCIpID8gYiA9IHRoaXMudmFsaWRhdGUoKS5mb3JtKCkgOiAoYiA9ICEwLCBjID0gYSh0aGlzWzBdLmZvcm0pLnZhbGlkYXRlKCksIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGIgPSBjLmVsZW1lbnQodGhpcykgJiYgYlxuICAgICAgICAgICAgICAgIH0pKSwgYlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlbW92ZUF0dHJzOiBmdW5jdGlvbiAoYikge1xuICAgICAgICAgICAgICAgIHZhciBjID0ge30sXG4gICAgICAgICAgICAgICAgICAgIGQgPSB0aGlzO1xuICAgICAgICAgICAgICAgIHJldHVybiBhLmVhY2goYi5zcGxpdCgvXFxzLyksIGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgICAgICAgICAgICAgIGNbYl0gPSBkLmF0dHIoYiksIGQucmVtb3ZlQXR0cihiKVxuICAgICAgICAgICAgICAgIH0pLCBjXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcnVsZXM6IGZ1bmN0aW9uIChiLCBjKSB7XG4gICAgICAgICAgICAgICAgdmFyIGQsIGUsIGYsIGcsIGgsIGksIGogPSB0aGlzWzBdO1xuICAgICAgICAgICAgICAgIGlmIChiKSBzd2l0Y2ggKGQgPSBhLmRhdGEoai5mb3JtLCBcInZhbGlkYXRvclwiKS5zZXR0aW5ncywgZSA9IGQucnVsZXMsIGYgPSBhLnZhbGlkYXRvci5zdGF0aWNSdWxlcyhqKSwgYikge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiYWRkXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBhLmV4dGVuZChmLCBhLnZhbGlkYXRvci5ub3JtYWxpemVSdWxlKGMpKSwgZGVsZXRlIGYubWVzc2FnZXMsIGVbai5uYW1lXSA9IGYsIGMubWVzc2FnZXMgJiYgKGQubWVzc2FnZXNbai5uYW1lXSA9IGEuZXh0ZW5kKGQubWVzc2FnZXNbai5uYW1lXSwgYy5tZXNzYWdlcykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJyZW1vdmVcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjID8gKGkgPSB7fSwgYS5lYWNoKGMuc3BsaXQoL1xccy8pLCBmdW5jdGlvbiAoYiwgYykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlbY10gPSBmW2NdLCBkZWxldGUgZltjXSwgXCJyZXF1aXJlZFwiID09PSBjICYmIGEoaikucmVtb3ZlQXR0cihcImFyaWEtcmVxdWlyZWRcIilcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pLCBpKSA6IChkZWxldGUgZVtqLm5hbWVdLCBmKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZyA9IGEudmFsaWRhdG9yLm5vcm1hbGl6ZVJ1bGVzKGEuZXh0ZW5kKHt9LCBhLnZhbGlkYXRvci5jbGFzc1J1bGVzKGopLCBhLnZhbGlkYXRvci5hdHRyaWJ1dGVSdWxlcyhqKSwgYS52YWxpZGF0b3IuZGF0YVJ1bGVzKGopLCBhLnZhbGlkYXRvci5zdGF0aWNSdWxlcyhqKSksIGopLCBnLnJlcXVpcmVkICYmIChoID0gZy5yZXF1aXJlZCwgZGVsZXRlIGcucmVxdWlyZWQsIGcgPSBhLmV4dGVuZCh7XG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBoXG4gICAgICAgICAgICAgICAgfSwgZyksIGEoaikuYXR0cihcImFyaWEtcmVxdWlyZWRcIiwgXCJ0cnVlXCIpKSwgZy5yZW1vdGUgJiYgKGggPSBnLnJlbW90ZSwgZGVsZXRlIGcucmVtb3RlLCBnID0gYS5leHRlbmQoZywge1xuICAgICAgICAgICAgICAgICAgICByZW1vdGU6IGhcbiAgICAgICAgICAgICAgICB9KSksIGdcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSksIGEuZXh0ZW5kKGEuZXhwcltcIjpcIl0sIHtcbiAgICAgICAgICAgIGJsYW5rOiBmdW5jdGlvbiAoYikge1xuICAgICAgICAgICAgICAgIHJldHVybiAhYS50cmltKFwiXCIgKyBhKGIpLnZhbCgpKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZpbGxlZDogZnVuY3Rpb24gKGIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gISFhLnRyaW0oXCJcIiArIGEoYikudmFsKCkpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdW5jaGVja2VkOiBmdW5jdGlvbiAoYikge1xuICAgICAgICAgICAgICAgIHJldHVybiAhYShiKS5wcm9wKFwiY2hlY2tlZFwiKVxuICAgICAgICAgICAgfVxuICAgICAgICB9KSwgYS52YWxpZGF0b3IgPSBmdW5jdGlvbiAoYiwgYykge1xuICAgICAgICAgICAgdGhpcy5zZXR0aW5ncyA9IGEuZXh0ZW5kKCEwLCB7fSwgYS52YWxpZGF0b3IuZGVmYXVsdHMsIGIpLCB0aGlzLmN1cnJlbnRGb3JtID0gYywgdGhpcy5pbml0KClcbiAgICAgICAgfSwgYS52YWxpZGF0b3IuZm9ybWF0ID0gZnVuY3Rpb24gKGIsIGMpIHtcbiAgICAgICAgICAgIHJldHVybiAxID09PSBhcmd1bWVudHMubGVuZ3RoID9cbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjID0gYS5tYWtlQXJyYXkoYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGMudW5zaGlmdChiKSwgYS52YWxpZGF0b3IuZm9ybWF0LmFwcGx5KHRoaXMsIGMpXG4gICAgICAgICAgICAgICAgfSA6IChhcmd1bWVudHMubGVuZ3RoID4gMiAmJiBjLmNvbnN0cnVjdG9yICE9PSBBcnJheSAmJiAoYyA9IGEubWFrZUFycmF5KGFyZ3VtZW50cykuc2xpY2UoMSkpLCBjLmNvbnN0cnVjdG9yICE9PSBBcnJheSAmJiAoYyA9IFtjXSksIGEuZWFjaChjLCBmdW5jdGlvbiAoYSwgYykge1xuICAgICAgICAgICAgICAgIGIgPSBiLnJlcGxhY2UobmV3IFJlZ0V4cChcIlxcXFx7XCIgKyBhICsgXCJcXFxcfVwiLCBcImdcIiksIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfSksIGIpXG4gICAgICAgIH0sIGEuZXh0ZW5kKGEudmFsaWRhdG9yLCB7XG4gICAgICAgICAgICBkZWZhdWx0czoge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2VzOiB7fSxcbiAgICAgICAgICAgICAgICBncm91cHM6IHt9LFxuICAgICAgICAgICAgICAgIHJ1bGVzOiB7fSxcbiAgICAgICAgICAgICAgICBlcnJvckNsYXNzOiBcImVycm9yXCIsXG4gICAgICAgICAgICAgICAgdmFsaWRDbGFzczogXCJ2YWxpZFwiLFxuICAgICAgICAgICAgICAgIGVycm9yRWxlbWVudDogXCJsYWJlbFwiLFxuICAgICAgICAgICAgICAgIGZvY3VzSW52YWxpZDogITAsXG4gICAgICAgICAgICAgICAgZXJyb3JDb250YWluZXI6IGEoW10pLFxuICAgICAgICAgICAgICAgIGVycm9yTGFiZWxDb250YWluZXI6IGEoW10pLFxuICAgICAgICAgICAgICAgIG9uc3VibWl0OiAhMCxcbiAgICAgICAgICAgICAgICBpZ25vcmU6IFwiOmhpZGRlblwiLFxuICAgICAgICAgICAgICAgIGlnbm9yZVRpdGxlOiAhMSxcbiAgICAgICAgICAgICAgICBvbmZvY3VzaW46IGZ1bmN0aW9uIChhKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGFzdEFjdGl2ZSA9IGEsIHRoaXMuc2V0dGluZ3MuZm9jdXNDbGVhbnVwICYmICF0aGlzLmJsb2NrRm9jdXNDbGVhbnVwICYmICh0aGlzLnNldHRpbmdzLnVuaGlnaGxpZ2h0ICYmIHRoaXMuc2V0dGluZ3MudW5oaWdobGlnaHQuY2FsbCh0aGlzLCBhLCB0aGlzLnNldHRpbmdzLmVycm9yQ2xhc3MsIHRoaXMuc2V0dGluZ3MudmFsaWRDbGFzcyksIHRoaXMuaGlkZVRoZXNlKHRoaXMuZXJyb3JzRm9yKGEpKSlcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG9uZm9jdXNvdXQ6IGZ1bmN0aW9uIChhKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2hlY2thYmxlKGEpIHx8ICEoYS5uYW1lIGluIHRoaXMuc3VibWl0dGVkKSAmJiB0aGlzLm9wdGlvbmFsKGEpIHx8IHRoaXMuZWxlbWVudChhKVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgb25rZXl1cDogZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgICAgICAgICAgICAgKDkgIT09IGIud2hpY2ggfHwgXCJcIiAhPT0gdGhpcy5lbGVtZW50VmFsdWUoYSkpICYmIChhLm5hbWUgaW4gdGhpcy5zdWJtaXR0ZWQgfHwgYSA9PT0gdGhpcy5sYXN0RWxlbWVudCkgJiYgdGhpcy5lbGVtZW50KGEpXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBvbmNsaWNrOiBmdW5jdGlvbiAoYSkge1xuICAgICAgICAgICAgICAgICAgICBhLm5hbWUgaW4gdGhpcy5zdWJtaXR0ZWQgPyB0aGlzLmVsZW1lbnQoYSkgOiBhLnBhcmVudE5vZGUubmFtZSBpbiB0aGlzLnN1Ym1pdHRlZCAmJiB0aGlzLmVsZW1lbnQoYS5wYXJlbnROb2RlKVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgaGlnaGxpZ2h0OiBmdW5jdGlvbiAoYiwgYywgZCkge1xuICAgICAgICAgICAgICAgICAgICBcInJhZGlvXCIgPT09IGIudHlwZSA/IHRoaXMuZmluZEJ5TmFtZShiLm5hbWUpLmFkZENsYXNzKGMpLnJlbW92ZUNsYXNzKGQpIDogYShiKS5hZGRDbGFzcyhjKS5yZW1vdmVDbGFzcyhkKVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgdW5oaWdobGlnaHQ6IGZ1bmN0aW9uIChiLCBjLCBkKSB7XG4gICAgICAgICAgICAgICAgICAgIFwicmFkaW9cIiA9PT0gYi50eXBlID8gdGhpcy5maW5kQnlOYW1lKGIubmFtZSkucmVtb3ZlQ2xhc3MoYykuYWRkQ2xhc3MoZCkgOiBhKGIpLnJlbW92ZUNsYXNzKGMpLmFkZENsYXNzKGQpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNldERlZmF1bHRzOiBmdW5jdGlvbiAoYikge1xuICAgICAgICAgICAgICAgIGEuZXh0ZW5kKGEudmFsaWRhdG9yLmRlZmF1bHRzLCBiKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1lc3NhZ2VzOiB7XG4gICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFwiVGhpcyBmaWVsZCBpcyByZXF1aXJlZC5cIixcbiAgICAgICAgICAgICAgICByZW1vdGU6IFwiUGxlYXNlIGZpeCB0aGlzIGZpZWxkLlwiLFxuICAgICAgICAgICAgICAgIGVtYWlsOiBcIlBsZWFzZSBlbnRlciBhIHZhbGlkIGVtYWlsIGFkZHJlc3MuXCIsXG4gICAgICAgICAgICAgICAgdXJsOiBcIlBsZWFzZSBlbnRlciBhIHZhbGlkIFVSTC5cIixcbiAgICAgICAgICAgICAgICBkYXRlOiBcIlBsZWFzZSBlbnRlciBhIHZhbGlkIGRhdGUuXCIsXG4gICAgICAgICAgICAgICAgZGF0ZUlTTzogXCJQbGVhc2UgZW50ZXIgYSB2YWxpZCBkYXRlICggSVNPICkuXCIsXG4gICAgICAgICAgICAgICAgbnVtYmVyOiBcIlBsZWFzZSBlbnRlciBhIHZhbGlkIG51bWJlci5cIixcbiAgICAgICAgICAgICAgICBkaWdpdHM6IFwiUGxlYXNlIGVudGVyIG9ubHkgZGlnaXRzLlwiLFxuICAgICAgICAgICAgICAgIGNyZWRpdGNhcmQ6IFwiUGxlYXNlIGVudGVyIGEgdmFsaWQgY3JlZGl0IGNhcmQgbnVtYmVyLlwiLFxuICAgICAgICAgICAgICAgIGVxdWFsVG86IFwiUGxlYXNlIGVudGVyIHRoZSBzYW1lIHZhbHVlIGFnYWluLlwiLFxuICAgICAgICAgICAgICAgIG1heGxlbmd0aDogYS52YWxpZGF0b3IuZm9ybWF0KFwiUGxlYXNlIGVudGVyIG5vIG1vcmUgdGhhbiB7MH0gY2hhcmFjdGVycy5cIiksXG4gICAgICAgICAgICAgICAgbWlubGVuZ3RoOiBhLnZhbGlkYXRvci5mb3JtYXQoXCJQbGVhc2UgZW50ZXIgYXQgbGVhc3QgezB9IGNoYXJhY3RlcnMuXCIpLFxuICAgICAgICAgICAgICAgIHJhbmdlbGVuZ3RoOiBhLnZhbGlkYXRvci5mb3JtYXQoXCJQbGVhc2UgZW50ZXIgYSB2YWx1ZSBiZXR3ZWVuIHswfSBhbmQgezF9IGNoYXJhY3RlcnMgbG9uZy5cIiksXG4gICAgICAgICAgICAgICAgcmFuZ2U6IGEudmFsaWRhdG9yLmZvcm1hdChcIlBsZWFzZSBlbnRlciBhIHZhbHVlIGJldHdlZW4gezB9IGFuZCB7MX0uXCIpLFxuICAgICAgICAgICAgICAgIG1heDogYS52YWxpZGF0b3IuZm9ybWF0KFwiUGxlYXNlIGVudGVyIGEgdmFsdWUgbGVzcyB0aGFuIG9yIGVxdWFsIHRvIHswfS5cIiksXG4gICAgICAgICAgICAgICAgbWluOiBhLnZhbGlkYXRvci5mb3JtYXQoXCJQbGVhc2UgZW50ZXIgYSB2YWx1ZSBncmVhdGVyIHRoYW4gb3IgZXF1YWwgdG8gezB9LlwiKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGF1dG9DcmVhdGVSYW5nZXM6ICExLFxuICAgICAgICAgICAgcHJvdG90eXBlOiB7XG4gICAgICAgICAgICAgICAgaW5pdDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBiKGIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjID0gYS5kYXRhKHRoaXNbMF0uZm9ybSwgXCJ2YWxpZGF0b3JcIiksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZCA9IFwib25cIiArIGIudHlwZS5yZXBsYWNlKC9edmFsaWRhdGUvLCBcIlwiKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlID0gYy5zZXR0aW5ncztcbiAgICAgICAgICAgICAgICAgICAgICAgIGVbZF0gJiYgIXRoaXMuaXMoZS5pZ25vcmUpICYmIGVbZF0uY2FsbChjLCB0aGlzWzBdLCBiKVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sYWJlbENvbnRhaW5lciA9IGEodGhpcy5zZXR0aW5ncy5lcnJvckxhYmVsQ29udGFpbmVyKSwgdGhpcy5lcnJvckNvbnRleHQgPSB0aGlzLmxhYmVsQ29udGFpbmVyLmxlbmd0aCAmJiB0aGlzLmxhYmVsQ29udGFpbmVyIHx8IGEodGhpcy5jdXJyZW50Rm9ybSksIHRoaXMuY29udGFpbmVycyA9IGEodGhpcy5zZXR0aW5ncy5lcnJvckNvbnRhaW5lcikuYWRkKHRoaXMuc2V0dGluZ3MuZXJyb3JMYWJlbENvbnRhaW5lciksIHRoaXMuc3VibWl0dGVkID0ge30sIHRoaXMudmFsdWVDYWNoZSA9IHt9LCB0aGlzLnBlbmRpbmdSZXF1ZXN0ID0gMCwgdGhpcy5wZW5kaW5nID0ge30sIHRoaXMuaW52YWxpZCA9IHt9LCB0aGlzLnJlc2V0KCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjLCBkID0gdGhpcy5ncm91cHMgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgYS5lYWNoKHRoaXMuc2V0dGluZ3MuZ3JvdXBzLCBmdW5jdGlvbiAoYiwgYykge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJzdHJpbmdcIiA9PSB0eXBlb2YgYyAmJiAoYyA9IGMuc3BsaXQoL1xccy8pKSwgYS5lYWNoKGMsIGZ1bmN0aW9uIChhLCBjKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZFtjXSA9IGJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIH0pLCBjID0gdGhpcy5zZXR0aW5ncy5ydWxlcywgYS5lYWNoKGMsIGZ1bmN0aW9uIChiLCBkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjW2JdID0gYS52YWxpZGF0b3Iubm9ybWFsaXplUnVsZShkKVxuICAgICAgICAgICAgICAgICAgICB9KSwgYSh0aGlzLmN1cnJlbnRGb3JtKS52YWxpZGF0ZURlbGVnYXRlKFwiOnRleHQsIFt0eXBlPSdwYXNzd29yZCddLCBbdHlwZT0nZmlsZSddLCBzZWxlY3QsIHRleHRhcmVhLCBbdHlwZT0nbnVtYmVyJ10sIFt0eXBlPSdzZWFyY2gnXSAsW3R5cGU9J3RlbCddLCBbdHlwZT0ndXJsJ10sIFt0eXBlPSdlbWFpbCddLCBbdHlwZT0nZGF0ZXRpbWUnXSwgW3R5cGU9J2RhdGUnXSwgW3R5cGU9J21vbnRoJ10sIFt0eXBlPSd3ZWVrJ10sIFt0eXBlPSd0aW1lJ10sIFt0eXBlPSdkYXRldGltZS1sb2NhbCddLCBbdHlwZT0ncmFuZ2UnXSwgW3R5cGU9J2NvbG9yJ10sIFt0eXBlPSdyYWRpbyddLCBbdHlwZT0nY2hlY2tib3gnXVwiLCBcImZvY3VzaW4gZm9jdXNvdXQga2V5dXBcIiwgYikudmFsaWRhdGVEZWxlZ2F0ZShcInNlbGVjdCwgb3B0aW9uLCBbdHlwZT0ncmFkaW8nXSwgW3R5cGU9J2NoZWNrYm94J11cIiwgXCJjbGlja1wiLCBiKSwgdGhpcy5zZXR0aW5ncy5pbnZhbGlkSGFuZGxlciAmJiBhKHRoaXMuY3VycmVudEZvcm0pLmJpbmQoXCJpbnZhbGlkLWZvcm0udmFsaWRhdGVcIiwgdGhpcy5zZXR0aW5ncy5pbnZhbGlkSGFuZGxlciksIGEodGhpcy5jdXJyZW50Rm9ybSkuZmluZChcIltyZXF1aXJlZF0sIFtkYXRhLXJ1bGUtcmVxdWlyZWRdLCAucmVxdWlyZWRcIikuYXR0cihcImFyaWEtcmVxdWlyZWRcIiwgXCJ0cnVlXCIpXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBmb3JtOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNoZWNrRm9ybSgpLCBhLmV4dGVuZCh0aGlzLnN1Ym1pdHRlZCwgdGhpcy5lcnJvck1hcCksIHRoaXMuaW52YWxpZCA9IGEuZXh0ZW5kKHt9LCB0aGlzLmVycm9yTWFwKSwgdGhpcy52YWxpZCgpIHx8IGEodGhpcy5jdXJyZW50Rm9ybSkudHJpZ2dlckhhbmRsZXIoXCJpbnZhbGlkLWZvcm1cIiwgW3RoaXNdKSwgdGhpcy5zaG93RXJyb3JzKCksIHRoaXMudmFsaWQoKVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgY2hlY2tGb3JtOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJlcGFyZUZvcm0oKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgYSA9IDAsIGIgPSB0aGlzLmN1cnJlbnRFbGVtZW50cyA9IHRoaXMuZWxlbWVudHMoKTsgYlthXTsgYSsrKSB0aGlzLmNoZWNrKGJbYV0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy52YWxpZCgpXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBlbGVtZW50OiBmdW5jdGlvbiAoYikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYyA9IHRoaXMuY2xlYW4oYiksXG4gICAgICAgICAgICAgICAgICAgICAgICBkID0gdGhpcy52YWxpZGF0aW9uVGFyZ2V0Rm9yKGMpLFxuICAgICAgICAgICAgICAgICAgICAgICAgZSA9ICEwO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5sYXN0RWxlbWVudCA9IGQsIHZvaWQgMCA9PT0gZCA/IGRlbGV0ZSB0aGlzLmludmFsaWRbYy5uYW1lXSA6ICh0aGlzLnByZXBhcmVFbGVtZW50KGQpLCB0aGlzLmN1cnJlbnRFbGVtZW50cyA9IGEoZCksIGUgPSB0aGlzLmNoZWNrKGQpICE9PSAhMSwgZSA/IGRlbGV0ZSB0aGlzLmludmFsaWRbZC5uYW1lXSA6IHRoaXMuaW52YWxpZFtkLm5hbWVdID0gITApLCBhKGIpLmF0dHIoXCJhcmlhLWludmFsaWRcIiwgIWUpLCB0aGlzLm51bWJlck9mSW52YWxpZHMoKSB8fCAodGhpcy50b0hpZGUgPSB0aGlzLnRvSGlkZS5hZGQodGhpcy5jb250YWluZXJzKSksIHRoaXMuc2hvd0Vycm9ycygpLCBlXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBzaG93RXJyb3JzOiBmdW5jdGlvbiAoYikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoYikge1xuICAgICAgICAgICAgICAgICAgICAgICAgYS5leHRlbmQodGhpcy5lcnJvck1hcCwgYiksIHRoaXMuZXJyb3JMaXN0ID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBjIGluIGIpIHRoaXMuZXJyb3JMaXN0LnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGJbY10sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudDogdGhpcy5maW5kQnlOYW1lKGMpWzBdXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3VjY2Vzc0xpc3QgPSBhLmdyZXAodGhpcy5zdWNjZXNzTGlzdCwgZnVuY3Rpb24gKGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gIShhLm5hbWUgaW4gYilcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXR0aW5ncy5zaG93RXJyb3JzID8gdGhpcy5zZXR0aW5ncy5zaG93RXJyb3JzLmNhbGwodGhpcywgdGhpcy5lcnJvck1hcCwgdGhpcy5lcnJvckxpc3QpIDogdGhpcy5kZWZhdWx0U2hvd0Vycm9ycygpXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICByZXNldEZvcm06IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgYS5mbi5yZXNldEZvcm0gJiYgYSh0aGlzLmN1cnJlbnRGb3JtKS5yZXNldEZvcm0oKSwgdGhpcy5zdWJtaXR0ZWQgPSB7fSwgdGhpcy5sYXN0RWxlbWVudCA9IG51bGwsIHRoaXMucHJlcGFyZUZvcm0oKSwgdGhpcy5oaWRlRXJyb3JzKCksIHRoaXMuZWxlbWVudHMoKS5yZW1vdmVDbGFzcyh0aGlzLnNldHRpbmdzLmVycm9yQ2xhc3MpLnJlbW92ZURhdGEoXCJwcmV2aW91c1ZhbHVlXCIpLnJlbW92ZUF0dHIoXCJhcmlhLWludmFsaWRcIilcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG51bWJlck9mSW52YWxpZHM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMub2JqZWN0TGVuZ3RoKHRoaXMuaW52YWxpZClcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG9iamVjdExlbmd0aDogZnVuY3Rpb24gKGEpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGIsIGMgPSAwO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGIgaW4gYSkgYysrO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgaGlkZUVycm9yczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmhpZGVUaGVzZSh0aGlzLnRvSGlkZSlcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGhpZGVUaGVzZTogZnVuY3Rpb24gKGEpIHtcbiAgICAgICAgICAgICAgICAgICAgYS5ub3QodGhpcy5jb250YWluZXJzKS50ZXh0KFwiXCIpLCB0aGlzLmFkZFdyYXBwZXIoYSkuaGlkZSgpXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB2YWxpZDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMCA9PT0gdGhpcy5zaXplKClcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHNpemU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZXJyb3JMaXN0Lmxlbmd0aFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZm9jdXNJbnZhbGlkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnNldHRpbmdzLmZvY3VzSW52YWxpZCkgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGEodGhpcy5maW5kTGFzdEFjdGl2ZSgpIHx8IHRoaXMuZXJyb3JMaXN0Lmxlbmd0aCAmJiB0aGlzLmVycm9yTGlzdFswXS5lbGVtZW50IHx8IFtdKS5maWx0ZXIoXCI6dmlzaWJsZVwiKS5mb2N1cygpLnRyaWdnZXIoXCJmb2N1c2luXCIpXG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGIpIHtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZmluZExhc3RBY3RpdmU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGIgPSB0aGlzLmxhc3RBY3RpdmU7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBiICYmIDEgPT09IGEuZ3JlcCh0aGlzLmVycm9yTGlzdCwgZnVuY3Rpb24gKGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBhLmVsZW1lbnQubmFtZSA9PT0gYi5uYW1lXG4gICAgICAgICAgICAgICAgICAgIH0pLmxlbmd0aCAmJiBiXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBlbGVtZW50czogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYiA9IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgICAgICBjID0ge307XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhKHRoaXMuY3VycmVudEZvcm0pLmZpbmQoXCJpbnB1dCwgc2VsZWN0LCB0ZXh0YXJlYVwiKS5ub3QoXCI6c3VibWl0LCA6cmVzZXQsIDppbWFnZSwgW2Rpc2FibGVkXVwiKS5ub3QodGhpcy5zZXR0aW5ncy5pZ25vcmUpLmZpbHRlcihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gIXRoaXMubmFtZSAmJiBiLnNldHRpbmdzLmRlYnVnICYmIHdpbmRvdy5jb25zb2xlICYmIGNvbnNvbGUuZXJyb3IoXCIlbyBoYXMgbm8gbmFtZSBhc3NpZ25lZFwiLCB0aGlzKSwgdGhpcy5uYW1lIGluIGMgfHwgIWIub2JqZWN0TGVuZ3RoKGEodGhpcykucnVsZXMoKSkgPyAhMSA6IChjW3RoaXMubmFtZV0gPSAhMCwgITApXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBjbGVhbjogZnVuY3Rpb24gKGIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGEoYilbMF1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGVycm9yczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYiA9IHRoaXMuc2V0dGluZ3MuZXJyb3JDbGFzcy5zcGxpdChcIiBcIikuam9pbihcIi5cIik7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhKHRoaXMuc2V0dGluZ3MuZXJyb3JFbGVtZW50ICsgXCIuXCIgKyBiLCB0aGlzLmVycm9yQ29udGV4dClcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHJlc2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3VjY2Vzc0xpc3QgPSBbXSwgdGhpcy5lcnJvckxpc3QgPSBbXSwgdGhpcy5lcnJvck1hcCA9IHt9LCB0aGlzLnRvU2hvdyA9IGEoW10pLCB0aGlzLnRvSGlkZSA9IGEoW10pLCB0aGlzLmN1cnJlbnRFbGVtZW50cyA9IGEoW10pXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBwcmVwYXJlRm9ybTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlc2V0KCksIHRoaXMudG9IaWRlID0gdGhpcy5lcnJvcnMoKS5hZGQodGhpcy5jb250YWluZXJzKVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgcHJlcGFyZUVsZW1lbnQ6IGZ1bmN0aW9uIChhKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVzZXQoKSwgdGhpcy50b0hpZGUgPSB0aGlzLmVycm9yc0ZvcihhKVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZWxlbWVudFZhbHVlOiBmdW5jdGlvbiAoYikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYywgZCA9IGEoYiksXG4gICAgICAgICAgICAgICAgICAgICAgICBlID0gYi50eXBlO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJyYWRpb1wiID09PSBlIHx8IFwiY2hlY2tib3hcIiA9PT0gZSA/IGEoXCJpbnB1dFtuYW1lPSdcIiArIGIubmFtZSArIFwiJ106Y2hlY2tlZFwiKS52YWwoKSA6IFwibnVtYmVyXCIgPT09IGUgJiYgXCJ1bmRlZmluZWRcIiAhPSB0eXBlb2YgYi52YWxpZGl0eSA/IGIudmFsaWRpdHkuYmFkSW5wdXQgPyAhMSA6IGQudmFsKCkgOiAoYyA9IGQudmFsKCksIFwic3RyaW5nXCIgPT0gdHlwZW9mIGMgPyBjLnJlcGxhY2UoL1xcci9nLCBcIlwiKSA6IGMpXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBjaGVjazogZnVuY3Rpb24gKGIpIHtcbiAgICAgICAgICAgICAgICAgICAgYiA9IHRoaXMudmFsaWRhdGlvblRhcmdldEZvcih0aGlzLmNsZWFuKGIpKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGMsIGQsIGUsIGYgPSBhKGIpLnJ1bGVzKCksXG4gICAgICAgICAgICAgICAgICAgICAgICBnID0gYS5tYXAoZiwgZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYlxuICAgICAgICAgICAgICAgICAgICAgICAgfSkubGVuZ3RoLFxuICAgICAgICAgICAgICAgICAgICAgICAgaCA9ICExLFxuICAgICAgICAgICAgICAgICAgICAgICAgaSA9IHRoaXMuZWxlbWVudFZhbHVlKGIpO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGQgaW4gZikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXRob2Q6IGQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyYW1ldGVyczogZltkXVxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGMgPSBhLnZhbGlkYXRvci5tZXRob2RzW2RdLmNhbGwodGhpcywgaSwgYiwgZS5wYXJhbWV0ZXJzKSwgXCJkZXBlbmRlbmN5LW1pc21hdGNoXCIgPT09IGMgJiYgMSA9PT0gZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoID0gITA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChoID0gITEsIFwicGVuZGluZ1wiID09PSBjKSByZXR1cm4gdm9pZCh0aGlzLnRvSGlkZSA9IHRoaXMudG9IaWRlLm5vdCh0aGlzLmVycm9yc0ZvcihiKSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghYykgcmV0dXJuIHRoaXMuZm9ybWF0QW5kQWRkKGIsIGUpLCAhMVxuICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoaikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IHRoaXMuc2V0dGluZ3MuZGVidWcgJiYgd2luZG93LmNvbnNvbGUgJiYgY29uc29sZS5sb2coXCJFeGNlcHRpb24gb2NjdXJyZWQgd2hlbiBjaGVja2luZyBlbGVtZW50IFwiICsgYi5pZCArIFwiLCBjaGVjayB0aGUgJ1wiICsgZS5tZXRob2QgKyBcIicgbWV0aG9kLlwiLCBqKSwgalxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICghaCkgcmV0dXJuIHRoaXMub2JqZWN0TGVuZ3RoKGYpICYmIHRoaXMuc3VjY2Vzc0xpc3QucHVzaChiKSwgITBcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGN1c3RvbURhdGFNZXNzYWdlOiBmdW5jdGlvbiAoYiwgYykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYShiKS5kYXRhKFwibXNnXCIgKyBjLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgYy5zdWJzdHJpbmcoMSkudG9Mb3dlckNhc2UoKSkgfHwgYShiKS5kYXRhKFwibXNnXCIpXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBjdXN0b21NZXNzYWdlOiBmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYyA9IHRoaXMuc2V0dGluZ3MubWVzc2FnZXNbYV07XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjICYmIChjLmNvbnN0cnVjdG9yID09PSBTdHJpbmcgPyBjIDogY1tiXSlcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGZpbmREZWZpbmVkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGEgPSAwOyBhIDwgYXJndW1lbnRzLmxlbmd0aDsgYSsrKSBpZiAodm9pZCAwICE9PSBhcmd1bWVudHNbYV0pIHJldHVybiBhcmd1bWVudHNbYV07XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2b2lkIDBcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGRlZmF1bHRNZXNzYWdlOiBmdW5jdGlvbiAoYiwgYykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5maW5kRGVmaW5lZCh0aGlzLmN1c3RvbU1lc3NhZ2UoYi5uYW1lLCBjKSwgdGhpcy5jdXN0b21EYXRhTWVzc2FnZShiLCBjKSwgIXRoaXMuc2V0dGluZ3MuaWdub3JlVGl0bGUgJiYgYi50aXRsZSB8fCB2b2lkIDAsIGEudmFsaWRhdG9yLm1lc3NhZ2VzW2NdLCBcIjxzdHJvbmc+V2FybmluZzogTm8gbWVzc2FnZSBkZWZpbmVkIGZvciBcIiArIGIubmFtZSArIFwiPC9zdHJvbmc+XCIpXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBmb3JtYXRBbmRBZGQ6IGZ1bmN0aW9uIChiLCBjKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkID0gdGhpcy5kZWZhdWx0TWVzc2FnZShiLCBjLm1ldGhvZCksXG4gICAgICAgICAgICAgICAgICAgICAgICBlID0gL1xcJD9cXHsoXFxkKylcXH0vZztcbiAgICAgICAgICAgICAgICAgICAgXCJmdW5jdGlvblwiID09IHR5cGVvZiBkID8gZCA9IGQuY2FsbCh0aGlzLCBjLnBhcmFtZXRlcnMsIGIpIDogZS50ZXN0KGQpICYmIChkID0gYS52YWxpZGF0b3IuZm9ybWF0KGQucmVwbGFjZShlLCBcInskMX1cIiksIGMucGFyYW1ldGVycykpLCB0aGlzLmVycm9yTGlzdC5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGQsXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50OiBiLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiBjLm1ldGhvZFxuICAgICAgICAgICAgICAgICAgICB9KSwgdGhpcy5lcnJvck1hcFtiLm5hbWVdID0gZCwgdGhpcy5zdWJtaXR0ZWRbYi5uYW1lXSA9IGRcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGFkZFdyYXBwZXI6IGZ1bmN0aW9uIChhKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNldHRpbmdzLndyYXBwZXIgJiYgKGEgPSBhLmFkZChhLnBhcmVudCh0aGlzLnNldHRpbmdzLndyYXBwZXIpKSksIGFcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGRlZmF1bHRTaG93RXJyb3JzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBhLCBiLCBjO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGEgPSAwOyB0aGlzLmVycm9yTGlzdFthXTsgYSsrKSBjID0gdGhpcy5lcnJvckxpc3RbYV0sIHRoaXMuc2V0dGluZ3MuaGlnaGxpZ2h0ICYmIHRoaXMuc2V0dGluZ3MuaGlnaGxpZ2h0LmNhbGwodGhpcywgYy5lbGVtZW50LCB0aGlzLnNldHRpbmdzLmVycm9yQ2xhc3MsIHRoaXMuc2V0dGluZ3MudmFsaWRDbGFzcyksIHRoaXMuc2hvd0xhYmVsKGMuZWxlbWVudCwgYy5tZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuZXJyb3JMaXN0Lmxlbmd0aCAmJiAodGhpcy50b1Nob3cgPSB0aGlzLnRvU2hvdy5hZGQodGhpcy5jb250YWluZXJzKSksIHRoaXMuc2V0dGluZ3Muc3VjY2VzcykgZm9yIChhID0gMDsgdGhpcy5zdWNjZXNzTGlzdFthXTsgYSsrKSB0aGlzLnNob3dMYWJlbCh0aGlzLnN1Y2Nlc3NMaXN0W2FdKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuc2V0dGluZ3MudW5oaWdobGlnaHQpIGZvciAoYSA9IDAsIGIgPSB0aGlzLnZhbGlkRWxlbWVudHMoKTsgYlthXTsgYSsrKSB0aGlzLnNldHRpbmdzLnVuaGlnaGxpZ2h0LmNhbGwodGhpcywgYlthXSwgdGhpcy5zZXR0aW5ncy5lcnJvckNsYXNzLCB0aGlzLnNldHRpbmdzLnZhbGlkQ2xhc3MpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRvSGlkZSA9IHRoaXMudG9IaWRlLm5vdCh0aGlzLnRvU2hvdyksIHRoaXMuaGlkZUVycm9ycygpLCB0aGlzLmFkZFdyYXBwZXIodGhpcy50b1Nob3cpLnNob3coKVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgdmFsaWRFbGVtZW50czogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50RWxlbWVudHMubm90KHRoaXMuaW52YWxpZEVsZW1lbnRzKCkpXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBpbnZhbGlkRWxlbWVudHM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGEodGhpcy5lcnJvckxpc3QpLm1hcChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBzaG93TGFiZWw6IGZ1bmN0aW9uIChiLCBjKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkLCBlLCBmLCBnID0gdGhpcy5lcnJvcnNGb3IoYiksXG4gICAgICAgICAgICAgICAgICAgICAgICBoID0gdGhpcy5pZE9yTmFtZShiKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGkgPSBhKGIpLmF0dHIoXCJhcmlhLWRlc2NyaWJlZGJ5XCIpO1xuICAgICAgICAgICAgICAgICAgICBnLmxlbmd0aCA/IChnLnJlbW92ZUNsYXNzKHRoaXMuc2V0dGluZ3MudmFsaWRDbGFzcykuYWRkQ2xhc3ModGhpcy5zZXR0aW5ncy5lcnJvckNsYXNzKSwgZy5odG1sKGMpKSA6IChnID0gYShcIjxcIiArIHRoaXMuc2V0dGluZ3MuZXJyb3JFbGVtZW50ICsgXCI+XCIpLmF0dHIoXCJpZFwiLCBoICsgXCItZXJyb3JcIikuYWRkQ2xhc3ModGhpcy5zZXR0aW5ncy5lcnJvckNsYXNzKS5odG1sKGMgfHwgXCJcIiksIGQgPSBnLCB0aGlzLnNldHRpbmdzLndyYXBwZXIgJiYgKGQgPSBnLmhpZGUoKS5zaG93KCkud3JhcChcIjxcIiArIHRoaXMuc2V0dGluZ3Mud3JhcHBlciArIFwiLz5cIikucGFyZW50KCkpLCB0aGlzLmxhYmVsQ29udGFpbmVyLmxlbmd0aCA/IHRoaXMubGFiZWxDb250YWluZXIuYXBwZW5kKGQpIDogdGhpcy5zZXR0aW5ncy5lcnJvclBsYWNlbWVudCA/IHRoaXMuc2V0dGluZ3MuZXJyb3JQbGFjZW1lbnQoZCwgYShiKSkgOiBkLmFwcGVuZFRvKCQoYikucGFyZW50KCkpLCBnLmlzKFwibGFiZWxcIikgPyBnLmF0dHIoXCJmb3JcIiwgaCkgOiAwID09PSBnLnBhcmVudHMoXCJsYWJlbFtmb3I9J1wiICsgaCArIFwiJ11cIikubGVuZ3RoICYmIChmID0gZy5hdHRyKFwiaWRcIiksIGkgPyBpLm1hdGNoKG5ldyBSZWdFeHAoXCJcXGJcIiArIGYgKyBcIlxcYlwiKSkgfHwgKGkgKz0gXCIgXCIgKyBmKSA6IGkgPSBmLCBhKGIpLmF0dHIoXCJhcmlhLWRlc2NyaWJlZGJ5XCIsIGkpLCBlID0gdGhpcy5ncm91cHNbYi5uYW1lXSwgZSAmJiBhLmVhY2godGhpcy5ncm91cHMsIGZ1bmN0aW9uIChiLCBjKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjID09PSBlICYmIGEoXCJbbmFtZT0nXCIgKyBiICsgXCInXVwiLCB0aGlzLmN1cnJlbnRGb3JtKS5hdHRyKFwiYXJpYS1kZXNjcmliZWRieVwiLCBnLmF0dHIoXCJpZFwiKSlcbiAgICAgICAgICAgICAgICAgICAgfSkpKSwgIWMgJiYgdGhpcy5zZXR0aW5ncy5zdWNjZXNzICYmIChnLnRleHQoXCJcIiksIFwic3RyaW5nXCIgPT0gdHlwZW9mIHRoaXMuc2V0dGluZ3Muc3VjY2VzcyA/IGcuYWRkQ2xhc3ModGhpcy5zZXR0aW5ncy5zdWNjZXNzKSA6IHRoaXMuc2V0dGluZ3Muc3VjY2VzcyhnLCBiKSksIHRoaXMudG9TaG93ID0gdGhpcy50b1Nob3cuYWRkKGcpXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBlcnJvcnNGb3I6IGZ1bmN0aW9uIChiKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjID0gdGhpcy5pZE9yTmFtZShiKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGQgPSBhKGIpLmF0dHIoXCJhcmlhLWRlc2NyaWJlZGJ5XCIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgZSA9IFwibGFiZWxbZm9yPSdcIiArIGMgKyBcIiddLCBsYWJlbFtmb3I9J1wiICsgYyArIFwiJ10gKlwiO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZCAmJiAoZSA9IGUgKyBcIiwgI1wiICsgZC5yZXBsYWNlKC9cXHMrL2csIFwiLCAjXCIpKSwgdGhpcy5lcnJvcnMoKS5maWx0ZXIoZSlcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGlkT3JOYW1lOiBmdW5jdGlvbiAoYSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5ncm91cHNbYS5uYW1lXSB8fCAodGhpcy5jaGVja2FibGUoYSkgPyBhLm5hbWUgOiBhLmlkIHx8IGEubmFtZSlcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHZhbGlkYXRpb25UYXJnZXRGb3I6IGZ1bmN0aW9uIChhKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNoZWNrYWJsZShhKSAmJiAoYSA9IHRoaXMuZmluZEJ5TmFtZShhLm5hbWUpLm5vdCh0aGlzLnNldHRpbmdzLmlnbm9yZSlbMF0pLCBhXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBjaGVja2FibGU6IGZ1bmN0aW9uIChhKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAvcmFkaW98Y2hlY2tib3gvaS50ZXN0KGEudHlwZSlcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGZpbmRCeU5hbWU6IGZ1bmN0aW9uIChiKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhKHRoaXMuY3VycmVudEZvcm0pLmZpbmQoXCJbbmFtZT0nXCIgKyBiICsgXCInXVwiKVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZ2V0TGVuZ3RoOiBmdW5jdGlvbiAoYiwgYykge1xuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKGMubm9kZU5hbWUudG9Mb3dlckNhc2UoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcInNlbGVjdFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBhKFwib3B0aW9uOnNlbGVjdGVkXCIsIGMpLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJpbnB1dFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmNoZWNrYWJsZShjKSkgcmV0dXJuIHRoaXMuZmluZEJ5TmFtZShjLm5hbWUpLmZpbHRlcihcIjpjaGVja2VkXCIpLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBiLmxlbmd0aFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZGVwZW5kOiBmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5kZXBlbmRUeXBlc1t0eXBlb2YgYV0gPyB0aGlzLmRlcGVuZFR5cGVzW3R5cGVvZiBhXShhLCBiKSA6ICEwXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBkZXBlbmRUeXBlczoge1xuICAgICAgICAgICAgICAgICAgICBcImJvb2xlYW5cIjogZnVuY3Rpb24gKGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBhXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHN0cmluZzogZnVuY3Rpb24gKGIsIGMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAhIWEoYiwgYy5mb3JtKS5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgXCJmdW5jdGlvblwiOiBmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGEoYilcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgb3B0aW9uYWw6IGZ1bmN0aW9uIChiKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjID0gdGhpcy5lbGVtZW50VmFsdWUoYik7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAhYS52YWxpZGF0b3IubWV0aG9kcy5yZXF1aXJlZC5jYWxsKHRoaXMsIGMsIGIpICYmIFwiZGVwZW5kZW5jeS1taXNtYXRjaFwiXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBzdGFydFJlcXVlc3Q6IGZ1bmN0aW9uIChhKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGVuZGluZ1thLm5hbWVdIHx8ICh0aGlzLnBlbmRpbmdSZXF1ZXN0KyssIHRoaXMucGVuZGluZ1thLm5hbWVdID0gITApXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBzdG9wUmVxdWVzdDogZnVuY3Rpb24gKGIsIGMpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wZW5kaW5nUmVxdWVzdC0tLCB0aGlzLnBlbmRpbmdSZXF1ZXN0IDwgMCAmJiAodGhpcy5wZW5kaW5nUmVxdWVzdCA9IDApLCBkZWxldGUgdGhpcy5wZW5kaW5nW2IubmFtZV0sIGMgJiYgMCA9PT0gdGhpcy5wZW5kaW5nUmVxdWVzdCAmJiB0aGlzLmZvcm1TdWJtaXR0ZWQgJiYgdGhpcy5mb3JtKCkgPyAoYSh0aGlzLmN1cnJlbnRGb3JtKS5zdWJtaXQoKSwgdGhpcy5mb3JtU3VibWl0dGVkID0gITEpIDogIWMgJiYgMCA9PT0gdGhpcy5wZW5kaW5nUmVxdWVzdCAmJiB0aGlzLmZvcm1TdWJtaXR0ZWQgJiYgKGEodGhpcy5jdXJyZW50Rm9ybSkudHJpZ2dlckhhbmRsZXIoXCJpbnZhbGlkLWZvcm1cIiwgW3RoaXNdKSwgdGhpcy5mb3JtU3VibWl0dGVkID0gITEpXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBwcmV2aW91c1ZhbHVlOiBmdW5jdGlvbiAoYikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYS5kYXRhKGIsIFwicHJldmlvdXNWYWx1ZVwiKSB8fCBhLmRhdGEoYiwgXCJwcmV2aW91c1ZhbHVlXCIsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9sZDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbGlkOiAhMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IHRoaXMuZGVmYXVsdE1lc3NhZ2UoYiwgXCJyZW1vdGVcIilcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY2xhc3NSdWxlU2V0dGluZ3M6IHtcbiAgICAgICAgICAgICAgICByZXF1aXJlZDoge1xuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogITBcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGVtYWlsOiB7XG4gICAgICAgICAgICAgICAgICAgIGVtYWlsOiAhMFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgdXJsOiB7XG4gICAgICAgICAgICAgICAgICAgIHVybDogITBcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGRhdGU6IHtcbiAgICAgICAgICAgICAgICAgICAgZGF0ZTogITBcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGRhdGVJU086IHtcbiAgICAgICAgICAgICAgICAgICAgZGF0ZUlTTzogITBcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG51bWJlcjoge1xuICAgICAgICAgICAgICAgICAgICBudW1iZXI6ICEwXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBkaWdpdHM6IHtcbiAgICAgICAgICAgICAgICAgICAgZGlnaXRzOiAhMFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgY3JlZGl0Y2FyZDoge1xuICAgICAgICAgICAgICAgICAgICBjcmVkaXRjYXJkOiAhMFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBhZGRDbGFzc1J1bGVzOiBmdW5jdGlvbiAoYiwgYykge1xuICAgICAgICAgICAgICAgIGIuY29uc3RydWN0b3IgPT09IFN0cmluZyA/IHRoaXMuY2xhc3NSdWxlU2V0dGluZ3NbYl0gPSBjIDogYS5leHRlbmQodGhpcy5jbGFzc1J1bGVTZXR0aW5ncywgYilcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjbGFzc1J1bGVzOiBmdW5jdGlvbiAoYikge1xuICAgICAgICAgICAgICAgIHZhciBjID0ge30sXG4gICAgICAgICAgICAgICAgICAgIGQgPSBhKGIpLmF0dHIoXCJjbGFzc1wiKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZCAmJiBhLmVhY2goZC5zcGxpdChcIiBcIiksIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcyBpbiBhLnZhbGlkYXRvci5jbGFzc1J1bGVTZXR0aW5ncyAmJiBhLmV4dGVuZChjLCBhLnZhbGlkYXRvci5jbGFzc1J1bGVTZXR0aW5nc1t0aGlzXSlcbiAgICAgICAgICAgICAgICB9KSwgY1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGF0dHJpYnV0ZVJ1bGVzOiBmdW5jdGlvbiAoYikge1xuICAgICAgICAgICAgICAgIHZhciBjLCBkLCBlID0ge30sXG4gICAgICAgICAgICAgICAgICAgIGYgPSBhKGIpLFxuICAgICAgICAgICAgICAgICAgICBnID0gYi5nZXRBdHRyaWJ1dGUoXCJ0eXBlXCIpO1xuICAgICAgICAgICAgICAgIGZvciAoYyBpbiBhLnZhbGlkYXRvci5tZXRob2RzKVwicmVxdWlyZWRcIiA9PT0gYyA/IChkID0gYi5nZXRBdHRyaWJ1dGUoYyksIFwiXCIgPT09IGQgJiYgKGQgPSAhMCksIGQgPSAhIWQpIDogZCA9IGYuYXR0cihjKSwgL21pbnxtYXgvLnRlc3QoYykgJiYgKG51bGwgPT09IGcgfHwgL251bWJlcnxyYW5nZXx0ZXh0Ly50ZXN0KGcpKSAmJiAoZCA9IE51bWJlcihkKSksIGQgfHwgMCA9PT0gZCA/IGVbY10gPSBkIDogZyA9PT0gYyAmJiBcInJhbmdlXCIgIT09IGcgJiYgKGVbY10gPSAhMCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGUubWF4bGVuZ3RoICYmIC8tMXwyMTQ3NDgzNjQ3fDUyNDI4OC8udGVzdChlLm1heGxlbmd0aCkgJiYgZGVsZXRlIGUubWF4bGVuZ3RoLCBlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGF0YVJ1bGVzOiBmdW5jdGlvbiAoYikge1xuICAgICAgICAgICAgICAgIHZhciBjLCBkLCBlID0ge30sXG4gICAgICAgICAgICAgICAgICAgIGYgPSBhKGIpO1xuICAgICAgICAgICAgICAgIGZvciAoYyBpbiBhLnZhbGlkYXRvci5tZXRob2RzKSBkID0gZi5kYXRhKFwicnVsZVwiICsgYy5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIGMuc3Vic3RyaW5nKDEpLnRvTG93ZXJDYXNlKCkpLCB2b2lkIDAgIT09IGQgJiYgKGVbY10gPSBkKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YXRpY1J1bGVzOiBmdW5jdGlvbiAoYikge1xuICAgICAgICAgICAgICAgIHZhciBjID0ge30sXG4gICAgICAgICAgICAgICAgICAgIGQgPSBhLmRhdGEoYi5mb3JtLCBcInZhbGlkYXRvclwiKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZC5zZXR0aW5ncy5ydWxlcyAmJiAoYyA9IGEudmFsaWRhdG9yLm5vcm1hbGl6ZVJ1bGUoZC5zZXR0aW5ncy5ydWxlc1tiLm5hbWVdKSB8fCB7fSksIGNcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBub3JtYWxpemVSdWxlczogZnVuY3Rpb24gKGIsIGMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYS5lYWNoKGIsIGZ1bmN0aW9uIChkLCBlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlID09PSAhMSkgcmV0dXJuIHZvaWQgZGVsZXRlIGJbZF07XG4gICAgICAgICAgICAgICAgICAgIGlmIChlLnBhcmFtIHx8IGUuZGVwZW5kcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGYgPSAhMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN3aXRjaCAodHlwZW9mIGUuZGVwZW5kcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJzdHJpbmdcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZiA9ICEhYShlLmRlcGVuZHMsIGMuZm9ybSkubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiZnVuY3Rpb25cIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZiA9IGUuZGVwZW5kcy5jYWxsKGMsIGMpXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBmID8gYltkXSA9IHZvaWQgMCAhPT0gZS5wYXJhbSA/IGUucGFyYW0gOiAhMCA6IGRlbGV0ZSBiW2RdXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KSwgYS5lYWNoKGIsIGZ1bmN0aW9uIChkLCBlKSB7XG4gICAgICAgICAgICAgICAgICAgIGJbZF0gPSBhLmlzRnVuY3Rpb24oZSkgPyBlKGMpIDogZVxuICAgICAgICAgICAgICAgIH0pLCBhLmVhY2goW1wibWlubGVuZ3RoXCIsIFwibWF4bGVuZ3RoXCJdLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGJbdGhpc10gJiYgKGJbdGhpc10gPSBOdW1iZXIoYlt0aGlzXSkpXG4gICAgICAgICAgICAgICAgfSksIGEuZWFjaChbXCJyYW5nZWxlbmd0aFwiLCBcInJhbmdlXCJdLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjO1xuICAgICAgICAgICAgICAgICAgICBiW3RoaXNdICYmIChhLmlzQXJyYXkoYlt0aGlzXSkgPyBiW3RoaXNdID0gW051bWJlcihiW3RoaXNdWzBdKSwgTnVtYmVyKGJbdGhpc11bMV0pXSA6IFwic3RyaW5nXCIgPT0gdHlwZW9mIGJbdGhpc10gJiYgKGMgPSBiW3RoaXNdLnJlcGxhY2UoL1tcXFtcXF1dL2csIFwiXCIpLnNwbGl0KC9bXFxzLF0rLyksIGJbdGhpc10gPSBbTnVtYmVyKGNbMF0pLCBOdW1iZXIoY1sxXSldKSlcbiAgICAgICAgICAgICAgICB9KSwgYS52YWxpZGF0b3IuYXV0b0NyZWF0ZVJhbmdlcyAmJiAoYi5taW4gJiYgYi5tYXggJiYgKGIucmFuZ2UgPSBbYi5taW4sIGIubWF4XSwgZGVsZXRlIGIubWluLCBkZWxldGUgYi5tYXgpLCBiLm1pbmxlbmd0aCAmJiBiLm1heGxlbmd0aCAmJiAoYi5yYW5nZWxlbmd0aCA9IFtiLm1pbmxlbmd0aCwgYi5tYXhsZW5ndGhdLCBkZWxldGUgYi5taW5sZW5ndGgsIGRlbGV0ZSBiLm1heGxlbmd0aCkpLCBiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbm9ybWFsaXplUnVsZTogZnVuY3Rpb24gKGIpIHtcbiAgICAgICAgICAgICAgICBpZiAoXCJzdHJpbmdcIiA9PSB0eXBlb2YgYikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYyA9IHt9O1xuICAgICAgICAgICAgICAgICAgICBhLmVhY2goYi5zcGxpdCgvXFxzLyksIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNbdGhpc10gPSAhMFxuICAgICAgICAgICAgICAgICAgICB9KSwgYiA9IGNcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBhZGRNZXRob2Q6IGZ1bmN0aW9uIChiLCBjLCBkKSB7XG4gICAgICAgICAgICAgICAgYS52YWxpZGF0b3IubWV0aG9kc1tiXSA9IGMsIGEudmFsaWRhdG9yLm1lc3NhZ2VzW2JdID0gdm9pZCAwICE9PSBkID8gZCA6IGEudmFsaWRhdG9yLm1lc3NhZ2VzW2JdLCBjLmxlbmd0aCA8IDMgJiYgYS52YWxpZGF0b3IuYWRkQ2xhc3NSdWxlcyhiLCBhLnZhbGlkYXRvci5ub3JtYWxpemVSdWxlKGIpKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1ldGhvZHM6IHtcbiAgICAgICAgICAgICAgICByZXF1aXJlZDogZnVuY3Rpb24gKGIsIGMsIGQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLmRlcGVuZChkLCBjKSkgcmV0dXJuIFwiZGVwZW5kZW5jeS1taXNtYXRjaFwiO1xuICAgICAgICAgICAgICAgICAgICBpZiAoXCJzZWxlY3RcIiA9PT0gYy5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZSA9IGEoYykudmFsKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZSAmJiBlLmxlbmd0aCA+IDBcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jaGVja2FibGUoYykgPyB0aGlzLmdldExlbmd0aChiLCBjKSA+IDAgOiBhLnRyaW0oYikubGVuZ3RoID4gMFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZW1haWw6IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm9wdGlvbmFsKGIpIHx8IC9eW2EtekEtWjAtOS4hIyQlJicqK1xcLz0/Xl9ge3x9fi1dK0BbYS16QS1aMC05XSg/OlthLXpBLVowLTktXXswLDYxfVthLXpBLVowLTldKT8oPzpcXC5bYS16QS1aMC05XSg/OlthLXpBLVowLTktXXswLDYxfVthLXpBLVowLTldKT8pKiQvLnRlc3QoYSlcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHVybDogZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9uYWwoYikgfHwgL14oaHR0cHM/fHM/ZnRwKTpcXC9cXC8oKCgoW2Etel18XFxkfC18XFwufF98fnxbXFx1MDBBMC1cXHVEN0ZGXFx1RjkwMC1cXHVGRENGXFx1RkRGMC1cXHVGRkVGXSl8KCVbXFxkYS1mXXsyfSl8WyFcXCQmJ1xcKFxcKVxcKlxcKyw7PV18OikqQCk/KCgoXFxkfFsxLTldXFxkfDFcXGRcXGR8MlswLTRdXFxkfDI1WzAtNV0pXFwuKFxcZHxbMS05XVxcZHwxXFxkXFxkfDJbMC00XVxcZHwyNVswLTVdKVxcLihcXGR8WzEtOV1cXGR8MVxcZFxcZHwyWzAtNF1cXGR8MjVbMC01XSlcXC4oXFxkfFsxLTldXFxkfDFcXGRcXGR8MlswLTRdXFxkfDI1WzAtNV0pKXwoKChbYS16XXxcXGR8W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pfCgoW2Etel18XFxkfFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKShbYS16XXxcXGR8LXxcXC58X3x+fFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKSooW2Etel18XFxkfFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKSkpXFwuKSsoKFthLXpdfFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKXwoKFthLXpdfFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKShbYS16XXxcXGR8LXxcXC58X3x+fFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKSooW2Etel18W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pKSlcXC4/KSg6XFxkKik/KShcXC8oKChbYS16XXxcXGR8LXxcXC58X3x+fFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKXwoJVtcXGRhLWZdezJ9KXxbIVxcJCYnXFwoXFwpXFwqXFwrLDs9XXw6fEApKyhcXC8oKFthLXpdfFxcZHwtfFxcLnxffH58W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pfCglW1xcZGEtZl17Mn0pfFshXFwkJidcXChcXClcXCpcXCssOz1dfDp8QCkqKSopPyk/KFxcPygoKFthLXpdfFxcZHwtfFxcLnxffH58W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pfCglW1xcZGEtZl17Mn0pfFshXFwkJidcXChcXClcXCpcXCssOz1dfDp8QCl8W1xcdUUwMDAtXFx1RjhGRl18XFwvfFxcPykqKT8oIygoKFthLXpdfFxcZHwtfFxcLnxffH58W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pfCglW1xcZGEtZl17Mn0pfFshXFwkJidcXChcXClcXCpcXCssOz1dfDp8QCl8XFwvfFxcPykqKT8kL2kudGVzdChhKVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZGF0ZTogZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9uYWwoYikgfHwgIS9JbnZhbGlkfE5hTi8udGVzdChuZXcgRGF0ZShhKS50b1N0cmluZygpKVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZGF0ZUlTTzogZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9uYWwoYikgfHwgL15cXGR7NH1bXFwvXFwtXSgwP1sxLTldfDFbMDEyXSlbXFwvXFwtXSgwP1sxLTldfFsxMl1bMC05XXwzWzAxXSkkLy50ZXN0KGEpXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBudW1iZXI6IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm9wdGlvbmFsKGIpIHx8IC9eLT8oPzpcXGQrfFxcZHsxLDN9KD86LFxcZHszfSkrKT8oPzpcXC5cXGQrKT8kLy50ZXN0KGEpXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBkaWdpdHM6IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm9wdGlvbmFsKGIpIHx8IC9eXFxkKyQvLnRlc3QoYSlcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGNyZWRpdGNhcmQ6IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbmFsKGIpKSByZXR1cm4gXCJkZXBlbmRlbmN5LW1pc21hdGNoXCI7XG4gICAgICAgICAgICAgICAgICAgIGlmICgvW14wLTkgXFwtXSsvLnRlc3QoYSkpIHJldHVybiAhMTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGMsIGQsIGUgPSAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgZiA9IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICBnID0gITE7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhID0gYS5yZXBsYWNlKC9cXEQvZywgXCJcIiksIGEubGVuZ3RoIDwgMTMgfHwgYS5sZW5ndGggPiAxOSkgcmV0dXJuICExO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGMgPSBhLmxlbmd0aCAtIDE7IGMgPj0gMDsgYy0tKSBkID0gYS5jaGFyQXQoYyksIGYgPSBwYXJzZUludChkLCAxMCksIGcgJiYgKGYgKj0gMikgPiA5ICYmIChmIC09IDkpLCBlICs9IGYsIGcgPSAhZztcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGUgJSAxMCA9PT0gMFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgbWlubGVuZ3RoOiBmdW5jdGlvbiAoYiwgYywgZCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZSA9IGEuaXNBcnJheShiKSA/IGIubGVuZ3RoIDogdGhpcy5nZXRMZW5ndGgoYS50cmltKGIpLCBjKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9uYWwoYykgfHwgZSA+PSBkXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBtYXhsZW5ndGg6IGZ1bmN0aW9uIChiLCBjLCBkKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBlID0gYS5pc0FycmF5KGIpID8gYi5sZW5ndGggOiB0aGlzLmdldExlbmd0aChhLnRyaW0oYiksIGMpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25hbChjKSB8fCBkID49IGVcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHJhbmdlbGVuZ3RoOiBmdW5jdGlvbiAoYiwgYywgZCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZSA9IGEuaXNBcnJheShiKSA/IGIubGVuZ3RoIDogdGhpcy5nZXRMZW5ndGgoYS50cmltKGIpLCBjKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9uYWwoYykgfHwgZSA+PSBkWzBdICYmIGUgPD0gZFsxXVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgbWluOiBmdW5jdGlvbiAoYSwgYiwgYykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25hbChiKSB8fCBhID49IGNcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG1heDogZnVuY3Rpb24gKGEsIGIsIGMpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9uYWwoYikgfHwgYyA+PSBhXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICByYW5nZTogZnVuY3Rpb24gKGEsIGIsIGMpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9uYWwoYikgfHwgYSA+PSBjWzBdICYmIGEgPD0gY1sxXVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZXF1YWxUbzogZnVuY3Rpb24gKGIsIGMsIGQpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGUgPSBhKGQpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zZXR0aW5ncy5vbmZvY3Vzb3V0ICYmIGUudW5iaW5kKFwiLnZhbGlkYXRlLWVxdWFsVG9cIikuYmluZChcImJsdXIudmFsaWRhdGUtZXF1YWxUb1wiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhKGMpLnZhbGlkKClcbiAgICAgICAgICAgICAgICAgICAgfSksIGIgPT09IGUudmFsKClcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHJlbW90ZTogZnVuY3Rpb24gKGIsIGMsIGQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9uYWwoYykpIHJldHVybiBcImRlcGVuZGVuY3ktbWlzbWF0Y2hcIjtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGUsIGYsIGcgPSB0aGlzLnByZXZpb3VzVmFsdWUoYyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNldHRpbmdzLm1lc3NhZ2VzW2MubmFtZV0gfHwgKHRoaXMuc2V0dGluZ3MubWVzc2FnZXNbYy5uYW1lXSA9IHt9KSwgZy5vcmlnaW5hbE1lc3NhZ2UgPSB0aGlzLnNldHRpbmdzLm1lc3NhZ2VzW2MubmFtZV0ucmVtb3RlLCB0aGlzLnNldHRpbmdzLm1lc3NhZ2VzW2MubmFtZV0ucmVtb3RlID0gZy5tZXNzYWdlLCBkID0gXCJzdHJpbmdcIiA9PSB0eXBlb2YgZCAmJiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1cmw6IGRcbiAgICAgICAgICAgICAgICAgICAgfSB8fCBkLCBnLm9sZCA9PT0gYiA/IGcudmFsaWQgOiAoZy5vbGQgPSBiLCBlID0gdGhpcywgdGhpcy5zdGFydFJlcXVlc3QoYyksIGYgPSB7fSwgZltjLm5hbWVdID0gYiwgYS5hamF4KGEuZXh0ZW5kKCEwLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1cmw6IGQsXG4gICAgICAgICAgICAgICAgICAgICAgICBtb2RlOiBcImFib3J0XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3J0OiBcInZhbGlkYXRlXCIgKyBjLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhVHlwZTogXCJqc29uXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiBmLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dDogZS5jdXJyZW50Rm9ybSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGYsIGgsIGksIGogPSBkID09PSAhMCB8fCBcInRydWVcIiA9PT0gZDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlLnNldHRpbmdzLm1lc3NhZ2VzW2MubmFtZV0ucmVtb3RlID0gZy5vcmlnaW5hbE1lc3NhZ2UsIGogPyAoaSA9IGUuZm9ybVN1Ym1pdHRlZCwgZS5wcmVwYXJlRWxlbWVudChjKSwgZS5mb3JtU3VibWl0dGVkID0gaSwgZS5zdWNjZXNzTGlzdC5wdXNoKGMpLCBkZWxldGUgZS5pbnZhbGlkW2MubmFtZV0sIGUuc2hvd0Vycm9ycygpKSA6IChmID0ge30sIGggPSBkIHx8IGUuZGVmYXVsdE1lc3NhZ2UoYywgXCJyZW1vdGVcIiksIGZbYy5uYW1lXSA9IGcubWVzc2FnZSA9IGEuaXNGdW5jdGlvbihoKSA/IGgoYikgOiBoLCBlLmludmFsaWRbYy5uYW1lXSA9ICEwLCBlLnNob3dFcnJvcnMoZikpLCBnLnZhbGlkID0gaiwgZS5zdG9wUmVxdWVzdChjLCBqKVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LCBkKSksIFwicGVuZGluZ1wiKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSksIGEuZm9ybWF0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhyb3cgXCIkLmZvcm1hdCBoYXMgYmVlbiBkZXByZWNhdGVkLiBQbGVhc2UgdXNlICQudmFsaWRhdG9yLmZvcm1hdCBpbnN0ZWFkLlwiXG4gICAgICAgIH07XG4gICAgICAgIHZhciBiLCBjID0ge307XG4gICAgICAgIGEuYWpheFByZWZpbHRlciA/IGEuYWpheFByZWZpbHRlcihmdW5jdGlvbiAoYSwgYiwgZCkge1xuICAgICAgICAgICAgdmFyIGUgPSBhLnBvcnQ7XG4gICAgICAgICAgICBcImFib3J0XCIgPT09IGEubW9kZSAmJiAoY1tlXSAmJiBjW2VdLmFib3J0KCksIGNbZV0gPSBkKVxuICAgICAgICB9KSA6IChiID0gYS5hamF4LCBhLmFqYXggPSBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgdmFyIGUgPSAoXCJtb2RlXCIgaW4gZCA/IGQgOiBhLmFqYXhTZXR0aW5ncykubW9kZSxcbiAgICAgICAgICAgICAgICBmID0gKFwicG9ydFwiIGluIGQgPyBkIDogYS5hamF4U2V0dGluZ3MpLnBvcnQ7XG4gICAgICAgICAgICByZXR1cm4gXCJhYm9ydFwiID09PSBlID8gKGNbZl0gJiYgY1tmXS5hYm9ydCgpLCBjW2ZdID0gYi5hcHBseSh0aGlzLCBhcmd1bWVudHMpLCBjW2ZdKSA6IGIuYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICAgICAgICB9KSwgYS5leHRlbmQoYS5mbiwge1xuICAgICAgICAgICAgdmFsaWRhdGVEZWxlZ2F0ZTogZnVuY3Rpb24gKGIsIGMsIGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5iaW5kKGMsIGZ1bmN0aW9uIChjKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBlID0gYShjLnRhcmdldCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlLmlzKGIpID8gZC5hcHBseShlLCBhcmd1bWVudHMpIDogdm9pZCAwXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9KTsiXSwiZmlsZSI6InBsdWdpbnMvdmFsaWRhdGUvdmFsaWRhdGUuanMifQ==
