/**
 * jQuery.marquee - scrolling text like old marquee element
 * @author Aamir Afridi - aamirafridi(at)gmail(dot)com / http://aamirafridi.com/jquery/jquery-marquee-plugin
 */;
(function($) {
    $.fn.marquee = function(options) {
        return this.each(function() {
            // Extend the options if any provided
            var o = $.extend({}, $.fn.marquee.defaults, options),
                $this = $(this),
                $marqueeWrapper, containerWidth, animationCss, verticalDir, elWidth,
                loopCount = 3,
                playState = 'animation-play-state',
                css3AnimationIsSupported = false,

                // Private methods
                _prefixedEvent = function(element, type, callback) {
                    var pfx = ["webkit", "moz", "MS", "o", ""];
                    for (var p = 0; p < pfx.length; p++) {
                        if (!pfx[p]) type = type.toLowerCase();
                        element.addEventListener(pfx[p] + type, callback, false);
                    }
                },

                _objToString = function(obj) {
                    var tabjson = [];
                    for (var p in obj) {
                        if (obj.hasOwnProperty(p)) {
                            tabjson.push(p + ':' + obj[p]);
                        }
                    }
                    tabjson.push();
                    return '{' + tabjson.join(',') + '}';
                },

                _startAnimationWithDelay = function() {
                    $this.timer = setTimeout(animate, o.delayBeforeStart);
                },

                // Public methods
                methods = {
                    pause: function() {
                        if (css3AnimationIsSupported && o.allowCss3Support) {
                            $marqueeWrapper.css(playState, 'paused');
                        } else {
                            // pause using pause plugin
                            if ($.fn.pause) {
                                $marqueeWrapper.pause();
                            }
                        }
                        // save the status
                        $this.data('runningStatus', 'paused');
                        // fire event
                        $this.trigger('paused');
                    },

                    resume: function() {
                        // resume using css3
                        if (css3AnimationIsSupported && o.allowCss3Support) {
                            $marqueeWrapper.css(playState, 'running');
                        } else {
                            // resume using pause plugin
                            if ($.fn.resume) {
                                $marqueeWrapper.resume();
                            }
                        }
                        // save the status
                        $this.data('runningStatus', 'resumed');
                        // fire event
                        $this.trigger('resumed');
                    },

                    toggle: function() {
                        methods[$this.data('runningStatus') == 'resumed' ? 'pause' : 'resume']();
                    },

                    destroy: function() {
                        // Clear timer
                        clearTimeout($this.timer);
                        // Unbind all events
                        $this.find("*").addBack().unbind();
                        // Just unwrap the elements that has been added using this plugin
                        $this.html($this.find('.js-marquee:first').html());
                    }
                };

            // Check for methods
            if (typeof options === 'string') {
                if ($.isFunction(methods[options])) {
                    // Following two IF statements to support public methods
                    if (!$marqueeWrapper) {
                        $marqueeWrapper = $this.find('.js-marquee-wrapper');
                    }
                    if ($this.data('css3AnimationIsSupported') === true) {
                        css3AnimationIsSupported = true;
                    }
                    methods[options]();
                }
                return;
            }

            /* Check if element has data attributes. They have top priority
               For details https://twitter.com/aamirafridi/status/403848044069679104 - Can't find a better solution :/
               jQuery 1.3.2 doesn't support $.data().KEY hence writting the following */
            var dataAttributes = {},
            attr;
            $.each(o, function(key, value) {
                // Check if element has this data attribute
                attr = $this.attr('data-' + key);
                if (typeof attr !== 'undefined') {
                    // Now check if value is boolean or not
                    switch (attr) {
                        case 'true':
                            attr = true;
                            break;
                        case 'false':
                            attr = false;
                            break;
                    }
                    o[key] = attr;
                }
            });

            // since speed option is changed to duration, to support speed for those who are already using it
            o.duration = o.speed || o.duration;

            // Shortcut to see if direction is upward or downward
            verticalDir = o.direction == 'up' || o.direction == 'down';

            // no gap if not duplicated
            o.gap = o.duplicated ? parseInt(o.gap) : 0;

            // wrap inner content into a div
            $this.wrapInner('<div class="js-marquee"></div>');

            // Make copy of the element
            var $el = $this.find('.js-marquee').css({
                'margin-right': o.gap,
                'float': 'left'
            });

            if (o.duplicated) {
                $el.clone(true).appendTo($this);
            }

            // wrap both inner elements into one div
            $this.wrapInner('<div style="width:100000px" class="js-marquee-wrapper"></div>');

            // Save the reference of the wrapper
            $marqueeWrapper = $this.find('.js-marquee-wrapper');

            // If direction is up or down, get the height of main element
            if (verticalDir) {
                var containerHeight = $this.height();
                $marqueeWrapper.removeAttr('style');
                $this.height(containerHeight);

                // Change the CSS for js-marquee element
                $this.find('.js-marquee').css({
                    'float': 'none',
                    'margin-bottom': o.gap,
                    'margin-right': 0
                });

                // Remove bottom margin from 2nd element if duplicated
                if (o.duplicated) $this.find('.js-marquee:last').css({
                    'margin-bottom': 0
                });

                var elHeight = $this.find('.js-marquee:first').height() + o.gap;

                // adjust the animation speed according to the text length
                if (o.startVisible && !o.duplicated) {
                    // Compute the complete animation duration and save it for later reference
                    // formula is to: (Height of the text node + height of the main container / Height of the main container) * speed;
                    o._completeDuration = ((parseInt(elHeight, 10) + parseInt(containerHeight, 10)) / parseInt(containerHeight, 10)) * o.duration;

                    // formula is to: (Height of the text node / height of the main container) * speed
                    o.duration = (parseInt(elHeight, 10) / parseInt(containerHeight, 10)) * o.duration;
                } else {
                    // formula is to: (Height of the text node + height of the main container / Height of the main container) * speed;
                    o.duration = ((parseInt(elHeight, 10) + parseInt(containerHeight, 10)) / parseInt(containerHeight, 10)) * o.duration;
                }

            } else {
                // Save the width of the each element so we can use it in animation
                elWidth = $this.find('.js-marquee:first').width() + o.gap;

                // container width
                containerWidth = $this.width();

                // adjust the animation speed according to the text length
                if (o.startVisible && !o.duplicated) {
                    // Compute the complete animation duration and save it for later reference
                    // formula is to: (Width of the text node + width of the main container / Width of the main container) * speed;
                    o._completeDuration = ((parseInt(elWidth, 10) + parseInt(containerWidth, 10)) / parseInt(containerWidth, 10)) * o.duration;

                    // (Width of the text node / width of the main container) * speed
                    o.duration = (parseInt(elWidth, 10) / parseInt(containerWidth, 10)) * o.duration;
                } else {
                    // formula is to: (Width of the text node + width of the main container / Width of the main container) * speed;
                    o.duration = ((parseInt(elWidth, 10) + parseInt(containerWidth, 10)) / parseInt(containerWidth, 10)) * o.duration;
                }
            }

            // if duplicated then reduce the speed
            if (o.duplicated) {
                o.duration = o.duration / 2;
            }

            if (o.allowCss3Support) {
                var
                elm = document.body || document.createElement('div'),
                    animationName = 'marqueeAnimation-' + Math.floor(Math.random() * 10000000),
                    domPrefixes = 'Webkit Moz O ms Khtml'.split(' '),
                    animationString = 'animation',
                    animationCss3Str = '',
                    keyframeString = '';

                // Check css3 support
                if (elm.style.animation) {
                    keyframeString = '@keyframes ' + animationName + ' ';
                    css3AnimationIsSupported = true;
                }

                if (css3AnimationIsSupported === false) {
                    for (var i = 0; i < domPrefixes.length; i++) {
                        if (elm.style[domPrefixes[i] + 'AnimationName'] !== undefined) {
                            var prefix = '-' + domPrefixes[i].toLowerCase() + '-';
                            animationString = prefix + animationString;
                            playState = prefix + playState;
                            keyframeString = '@' + prefix + 'keyframes ' + animationName + ' ';
                            css3AnimationIsSupported = true;
                            break;
                        }
                    }
                }

                if (css3AnimationIsSupported) {
                    animationCss3Str = animationName + ' ' + o.duration / 1000 + 's ' + o.delayBeforeStart / 1000 + 's infinite ' + o.css3easing;
                    $this.data('css3AnimationIsSupported', true);
                }
            }

            var _rePositionVertically = function() {
                $marqueeWrapper.css('margin-top', o.direction == 'up' ? containerHeight + 'px' : '-' + elHeight + 'px');
            },
            _rePositionHorizontally = function() {
                $marqueeWrapper.css('margin-left', o.direction == 'left' ? containerWidth + 'px' : '-' + elWidth + 'px');
            };

            // if duplicated option is set to true than position the wrapper
            if (o.duplicated) {
                if (verticalDir) {
                    if (o.startVisible) {
                        $marqueeWrapper.css('margin-top', 0);
                    } else {
                        $marqueeWrapper.css('margin-top', o.direction == 'up' ? containerHeight + 'px' : '-' + ((elHeight * 2) - o.gap) + 'px');
                    }
                } else {
                    if (o.startVisible) {
                        $marqueeWrapper.css('margin-left', 0);
                    } else {
                        $marqueeWrapper.css('margin-left', o.direction == 'left' ? containerWidth + 'px' : '-' + ((elWidth * 2) - o.gap) + 'px');
                    }
                }

                // If the text starts out visible we can skip the two initial loops
                if (!o.startVisible) {
                  loopCount = 1;
                }
            } else if (o.startVisible) {
                // We only have two different loops if marquee is duplicated and starts visible 
                loopCount = 2;
            } else {
                if (verticalDir) {
                    _rePositionVertically();
                } else {
                    _rePositionHorizontally();
                }
            }

            // Animate recursive method
            var animate = function() {
                if (o.duplicated) {
                    // When duplicated, the first loop will be scroll longer so double the duration
                    if (loopCount === 1) {
                        o._originalDuration = o.duration;
                        if (verticalDir) {
                            o.duration = o.direction == 'up' ? o.duration + (containerHeight / ((elHeight) / o.duration)) : o.duration * 2;
                        } else {
                            o.duration = o.direction == 'left' ? o.duration + (containerWidth / ((elWidth) / o.duration)) : o.duration * 2;
                        }
                        // Adjust the css3 animation as well
                        if (animationCss3Str) {
                            animationCss3Str = animationName + ' ' + o.duration / 1000 + 's ' + o.delayBeforeStart / 1000 + 's ' + o.css3easing;
                        }
                        loopCount++;
                    }
                    // On 2nd loop things back to normal, normal duration for the rest of animations
                    else if (loopCount === 2) {
                        o.duration = o._originalDuration;
                        // Adjust the css3 animation as well
                        if (animationCss3Str) {
                            animationName = animationName + '0';
                            keyframeString = $.trim(keyframeString) + '0 ';
                            animationCss3Str = animationName + ' ' + o.duration / 1000 + 's 0s infinite ' + o.css3easing;
                        }
                        loopCount++;
                    }
                }

                if (verticalDir) {
                    if (o.duplicated) {

                        // Adjust the starting point of animation only when first loops finishes
                        if (loopCount > 2) {
                            $marqueeWrapper.css('margin-top', o.direction == 'up' ? 0 : '-' + elHeight + 'px');
                        }

                        animationCss = {
                            'margin-top': o.direction == 'up' ? '-' + elHeight + 'px' : 0
                        };
                    } else if (o.startVisible) {
                        // This loop moves the marquee out of the container
                        if (loopCount === 2) {
                            // Adjust the css3 animation as well
                            if (animationCss3Str) {
                                animationCss3Str = animationName + ' ' + o.duration / 1000 + 's ' + o.delayBeforeStart / 1000 + 's ' + o.css3easing;
                            }
                            animationCss = {
                                'margin-top': o.direction == 'up' ? '-' + elHeight + 'px' : containerHeight + 'px'
                            };
                            loopCount++;
                        } else if (loopCount === 3) {
                            // Set the duration for the animation that will run forever
                            o.duration = o._completeDuration;
                            // Adjust the css3 animation as well
                            if (animationCss3Str) {
                                    animationName = animationName + '0';
                                    keyframeString = $.trim(keyframeString) + '0 ';
                                    animationCss3Str = animationName + ' ' + o.duration / 1000 + 's 0s infinite ' + o.css3easing;
                            }
                            _rePositionVertically();
                        }
                    } else {
                        _rePositionVertically();
                        animationCss = {
                            'margin-top': o.direction == 'up' ? '-' + ($marqueeWrapper.height()) + 'px' : containerHeight + 'px'
                        };
                    }
                } else {
                    if (o.duplicated) {

                        // Adjust the starting point of animation only when first loops finishes
                        if (loopCount > 2) {
                            $marqueeWrapper.css('margin-left', o.direction == 'left' ? 0 : '-' + elWidth + 'px');
                        }

                        animationCss = {
                            'margin-left': o.direction == 'left' ? '-' + elWidth + 'px' : 0
                        };

                    } else if (o.startVisible) {
                        // This loop moves the marquee out of the container
                        if (loopCount === 2) {
                            // Adjust the css3 animation as well
                            if (animationCss3Str) {
                                animationCss3Str = animationName + ' ' + o.duration / 1000 + 's ' + o.delayBeforeStart / 1000 + 's ' + o.css3easing;
                            }
                            animationCss = {
                                'margin-left': o.direction == 'left' ? '-' + elWidth + 'px' : containerWidth + 'px'
                            };
                            loopCount++;
                        } else if (loopCount === 3) {
                            // Set the duration for the animation that will run forever
                            o.duration = o._completeDuration;
                            // Adjust the css3 animation as well
                            if (animationCss3Str) {
                                animationName = animationName + '0';
                                keyframeString = $.trim(keyframeString) + '0 ';
                                animationCss3Str = animationName + ' ' + o.duration / 1000 + 's 0s infinite ' + o.css3easing;
                            }
                            _rePositionHorizontally();
                        }
                    } else {
                        _rePositionHorizontally();
                        animationCss = {
                            'margin-left': o.direction == 'left' ? '-' + elWidth + 'px' : containerWidth + 'px'
                        };
                    }
                }

                // fire event
                $this.trigger('beforeStarting');

                // If css3 support is available than do it with css3, otherwise use jQuery as fallback
                if (css3AnimationIsSupported) {
                    // Add css3 animation to the element
                    $marqueeWrapper.css(animationString, animationCss3Str);
                    var keyframeCss = keyframeString + ' { 100%  ' + _objToString(animationCss) + '}',
                         $styles = $marqueeWrapper.find('style');

                    // Now add the keyframe animation to the marquee element
                    if ($styles.length !== 0) {
                        // Bug fixed for jQuery 1.3.x - Instead of using .last(), use following
                        $styles.filter(":last").html(keyframeCss);
                    } else {
                        $('head').append('<style>' + keyframeCss + '</style>');
                    }

                    // Animation iteration event
                    _prefixedEvent($marqueeWrapper[0], "AnimationIteration", function() {
                        $this.trigger('finished');
                    });
                    // Animation stopped
                    _prefixedEvent($marqueeWrapper[0], "AnimationEnd", function() {
                        animate();
                        $this.trigger('finished');
                    });

                } else {
                    // Start animating
                    $marqueeWrapper.animate(animationCss, o.duration, o.easing, function() {
                        // fire event
                        $this.trigger('finished');
                        // animate again
                        if (o.pauseOnCycle) {
                            _startAnimationWithDelay();
                        } else {
                            animate();
                        }
                    });
                }
                // save the status
                $this.data('runningStatus', 'resumed');
            };

            // bind pause and resume events
            $this.bind('pause', methods.pause);
            $this.bind('resume', methods.resume);

            if (o.pauseOnHover) {
                $this.bind('mouseenter mouseleave', methods.toggle);
            }

            // If css3 animation is supported than call animate method at once
            if (css3AnimationIsSupported && o.allowCss3Support) {
                animate();
            } else {
                // Starts the recursive method
                _startAnimationWithDelay();
            }

        });
    }; // End of Plugin
    // Public: plugin defaults options
    $.fn.marquee.defaults = {
        // If you wish to always animate using jQuery
        allowCss3Support: true,
        // works when allowCss3Support is set to true - for full list see http://www.w3.org/TR/2013/WD-css3-transitions-20131119/#transition-timing-function
        css3easing: 'linear',
        // requires jQuery easing plugin. Default is 'linear'
        easing: 'linear',
        // pause time before the next animation turn in milliseconds
        delayBeforeStart: 1000,
        // 'left', 'right', 'up' or 'down'
        direction: 'left',
        // true or false - should the marquee be duplicated to show an effect of continues flow
        duplicated: false,
        // speed in milliseconds of the marquee in milliseconds
        duration: 5000,
        // gap in pixels between the tickers
        gap: 20,
        // on cycle pause the marquee
        pauseOnCycle: false,
        // on hover pause the marquee - using jQuery plugin https://github.com/tobia/Pause
        pauseOnHover: false,
        // the marquee is visible initially positioned next to the border towards it will be moving
        startVisible: false
    };
})(jQuery);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL2pxdWVyeS5tYXJxdWVlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogalF1ZXJ5Lm1hcnF1ZWUgLSBzY3JvbGxpbmcgdGV4dCBsaWtlIG9sZCBtYXJxdWVlIGVsZW1lbnRcbiAqIEBhdXRob3IgQWFtaXIgQWZyaWRpIC0gYWFtaXJhZnJpZGkoYXQpZ21haWwoZG90KWNvbSAvIGh0dHA6Ly9hYW1pcmFmcmlkaS5jb20vanF1ZXJ5L2pxdWVyeS1tYXJxdWVlLXBsdWdpblxuICovO1xuKGZ1bmN0aW9uKCQpIHtcbiAgICAkLmZuLm1hcnF1ZWUgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvLyBFeHRlbmQgdGhlIG9wdGlvbnMgaWYgYW55IHByb3ZpZGVkXG4gICAgICAgICAgICB2YXIgbyA9ICQuZXh0ZW5kKHt9LCAkLmZuLm1hcnF1ZWUuZGVmYXVsdHMsIG9wdGlvbnMpLFxuICAgICAgICAgICAgICAgICR0aGlzID0gJCh0aGlzKSxcbiAgICAgICAgICAgICAgICAkbWFycXVlZVdyYXBwZXIsIGNvbnRhaW5lcldpZHRoLCBhbmltYXRpb25Dc3MsIHZlcnRpY2FsRGlyLCBlbFdpZHRoLFxuICAgICAgICAgICAgICAgIGxvb3BDb3VudCA9IDMsXG4gICAgICAgICAgICAgICAgcGxheVN0YXRlID0gJ2FuaW1hdGlvbi1wbGF5LXN0YXRlJyxcbiAgICAgICAgICAgICAgICBjc3MzQW5pbWF0aW9uSXNTdXBwb3J0ZWQgPSBmYWxzZSxcblxuICAgICAgICAgICAgICAgIC8vIFByaXZhdGUgbWV0aG9kc1xuICAgICAgICAgICAgICAgIF9wcmVmaXhlZEV2ZW50ID0gZnVuY3Rpb24oZWxlbWVudCwgdHlwZSwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBmeCA9IFtcIndlYmtpdFwiLCBcIm1velwiLCBcIk1TXCIsIFwib1wiLCBcIlwiXTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgcCA9IDA7IHAgPCBwZngubGVuZ3RoOyBwKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcGZ4W3BdKSB0eXBlID0gdHlwZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKHBmeFtwXSArIHR5cGUsIGNhbGxiYWNrLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgX29ialRvU3RyaW5nID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB0YWJqc29uID0gW107XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIHAgaW4gb2JqKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KHApKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFianNvbi5wdXNoKHAgKyAnOicgKyBvYmpbcF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRhYmpzb24ucHVzaCgpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ3snICsgdGFianNvbi5qb2luKCcsJykgKyAnfSc7XG4gICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgIF9zdGFydEFuaW1hdGlvbldpdGhEZWxheSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAkdGhpcy50aW1lciA9IHNldFRpbWVvdXQoYW5pbWF0ZSwgby5kZWxheUJlZm9yZVN0YXJ0KTtcbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgLy8gUHVibGljIG1ldGhvZHNcbiAgICAgICAgICAgICAgICBtZXRob2RzID0ge1xuICAgICAgICAgICAgICAgICAgICBwYXVzZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3NzM0FuaW1hdGlvbklzU3VwcG9ydGVkICYmIG8uYWxsb3dDc3MzU3VwcG9ydCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRtYXJxdWVlV3JhcHBlci5jc3MocGxheVN0YXRlLCAncGF1c2VkJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHBhdXNlIHVzaW5nIHBhdXNlIHBsdWdpblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkLmZuLnBhdXNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRtYXJxdWVlV3JhcHBlci5wYXVzZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNhdmUgdGhlIHN0YXR1c1xuICAgICAgICAgICAgICAgICAgICAgICAgJHRoaXMuZGF0YSgncnVubmluZ1N0YXR1cycsICdwYXVzZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGZpcmUgZXZlbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICR0aGlzLnRyaWdnZXIoJ3BhdXNlZCcpO1xuICAgICAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgICAgIHJlc3VtZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyByZXN1bWUgdXNpbmcgY3NzM1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNzczNBbmltYXRpb25Jc1N1cHBvcnRlZCAmJiBvLmFsbG93Q3NzM1N1cHBvcnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkbWFycXVlZVdyYXBwZXIuY3NzKHBsYXlTdGF0ZSwgJ3J1bm5pbmcnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmVzdW1lIHVzaW5nIHBhdXNlIHBsdWdpblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkLmZuLnJlc3VtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkbWFycXVlZVdyYXBwZXIucmVzdW1lKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2F2ZSB0aGUgc3RhdHVzXG4gICAgICAgICAgICAgICAgICAgICAgICAkdGhpcy5kYXRhKCdydW5uaW5nU3RhdHVzJywgJ3Jlc3VtZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGZpcmUgZXZlbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICR0aGlzLnRyaWdnZXIoJ3Jlc3VtZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgICAgICB0b2dnbGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kc1skdGhpcy5kYXRhKCdydW5uaW5nU3RhdHVzJykgPT0gJ3Jlc3VtZWQnID8gJ3BhdXNlJyA6ICdyZXN1bWUnXSgpO1xuICAgICAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgICAgIGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2xlYXIgdGltZXJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCgkdGhpcy50aW1lcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBVbmJpbmQgYWxsIGV2ZW50c1xuICAgICAgICAgICAgICAgICAgICAgICAgJHRoaXMuZmluZChcIipcIikuYWRkQmFjaygpLnVuYmluZCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSnVzdCB1bndyYXAgdGhlIGVsZW1lbnRzIHRoYXQgaGFzIGJlZW4gYWRkZWQgdXNpbmcgdGhpcyBwbHVnaW5cbiAgICAgICAgICAgICAgICAgICAgICAgICR0aGlzLmh0bWwoJHRoaXMuZmluZCgnLmpzLW1hcnF1ZWU6Zmlyc3QnKS5odG1sKCkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLy8gQ2hlY2sgZm9yIG1ldGhvZHNcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBpZiAoJC5pc0Z1bmN0aW9uKG1ldGhvZHNbb3B0aW9uc10pKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEZvbGxvd2luZyB0d28gSUYgc3RhdGVtZW50cyB0byBzdXBwb3J0IHB1YmxpYyBtZXRob2RzXG4gICAgICAgICAgICAgICAgICAgIGlmICghJG1hcnF1ZWVXcmFwcGVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkbWFycXVlZVdyYXBwZXIgPSAkdGhpcy5maW5kKCcuanMtbWFycXVlZS13cmFwcGVyJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKCR0aGlzLmRhdGEoJ2NzczNBbmltYXRpb25Jc1N1cHBvcnRlZCcpID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjc3MzQW5pbWF0aW9uSXNTdXBwb3J0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZHNbb3B0aW9uc10oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvKiBDaGVjayBpZiBlbGVtZW50IGhhcyBkYXRhIGF0dHJpYnV0ZXMuIFRoZXkgaGF2ZSB0b3AgcHJpb3JpdHlcbiAgICAgICAgICAgICAgIEZvciBkZXRhaWxzIGh0dHBzOi8vdHdpdHRlci5jb20vYWFtaXJhZnJpZGkvc3RhdHVzLzQwMzg0ODA0NDA2OTY3OTEwNCAtIENhbid0IGZpbmQgYSBiZXR0ZXIgc29sdXRpb24gOi9cbiAgICAgICAgICAgICAgIGpRdWVyeSAxLjMuMiBkb2Vzbid0IHN1cHBvcnQgJC5kYXRhKCkuS0VZIGhlbmNlIHdyaXR0aW5nIHRoZSBmb2xsb3dpbmcgKi9cbiAgICAgICAgICAgIHZhciBkYXRhQXR0cmlidXRlcyA9IHt9LFxuICAgICAgICAgICAgYXR0cjtcbiAgICAgICAgICAgICQuZWFjaChvLCBmdW5jdGlvbihrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgLy8gQ2hlY2sgaWYgZWxlbWVudCBoYXMgdGhpcyBkYXRhIGF0dHJpYnV0ZVxuICAgICAgICAgICAgICAgIGF0dHIgPSAkdGhpcy5hdHRyKCdkYXRhLScgKyBrZXkpO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgYXR0ciAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gTm93IGNoZWNrIGlmIHZhbHVlIGlzIGJvb2xlYW4gb3Igbm90XG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAoYXR0cikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAndHJ1ZSc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXR0ciA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdmYWxzZSc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXR0ciA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIG9ba2V5XSA9IGF0dHI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIHNpbmNlIHNwZWVkIG9wdGlvbiBpcyBjaGFuZ2VkIHRvIGR1cmF0aW9uLCB0byBzdXBwb3J0IHNwZWVkIGZvciB0aG9zZSB3aG8gYXJlIGFscmVhZHkgdXNpbmcgaXRcbiAgICAgICAgICAgIG8uZHVyYXRpb24gPSBvLnNwZWVkIHx8IG8uZHVyYXRpb247XG5cbiAgICAgICAgICAgIC8vIFNob3J0Y3V0IHRvIHNlZSBpZiBkaXJlY3Rpb24gaXMgdXB3YXJkIG9yIGRvd253YXJkXG4gICAgICAgICAgICB2ZXJ0aWNhbERpciA9IG8uZGlyZWN0aW9uID09ICd1cCcgfHwgby5kaXJlY3Rpb24gPT0gJ2Rvd24nO1xuXG4gICAgICAgICAgICAvLyBubyBnYXAgaWYgbm90IGR1cGxpY2F0ZWRcbiAgICAgICAgICAgIG8uZ2FwID0gby5kdXBsaWNhdGVkID8gcGFyc2VJbnQoby5nYXApIDogMDtcblxuICAgICAgICAgICAgLy8gd3JhcCBpbm5lciBjb250ZW50IGludG8gYSBkaXZcbiAgICAgICAgICAgICR0aGlzLndyYXBJbm5lcignPGRpdiBjbGFzcz1cImpzLW1hcnF1ZWVcIj48L2Rpdj4nKTtcblxuICAgICAgICAgICAgLy8gTWFrZSBjb3B5IG9mIHRoZSBlbGVtZW50XG4gICAgICAgICAgICB2YXIgJGVsID0gJHRoaXMuZmluZCgnLmpzLW1hcnF1ZWUnKS5jc3Moe1xuICAgICAgICAgICAgICAgICdtYXJnaW4tcmlnaHQnOiBvLmdhcCxcbiAgICAgICAgICAgICAgICAnZmxvYXQnOiAnbGVmdCdcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBpZiAoby5kdXBsaWNhdGVkKSB7XG4gICAgICAgICAgICAgICAgJGVsLmNsb25lKHRydWUpLmFwcGVuZFRvKCR0aGlzKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gd3JhcCBib3RoIGlubmVyIGVsZW1lbnRzIGludG8gb25lIGRpdlxuICAgICAgICAgICAgJHRoaXMud3JhcElubmVyKCc8ZGl2IHN0eWxlPVwid2lkdGg6MTAwMDAwcHhcIiBjbGFzcz1cImpzLW1hcnF1ZWUtd3JhcHBlclwiPjwvZGl2PicpO1xuXG4gICAgICAgICAgICAvLyBTYXZlIHRoZSByZWZlcmVuY2Ugb2YgdGhlIHdyYXBwZXJcbiAgICAgICAgICAgICRtYXJxdWVlV3JhcHBlciA9ICR0aGlzLmZpbmQoJy5qcy1tYXJxdWVlLXdyYXBwZXInKTtcblxuICAgICAgICAgICAgLy8gSWYgZGlyZWN0aW9uIGlzIHVwIG9yIGRvd24sIGdldCB0aGUgaGVpZ2h0IG9mIG1haW4gZWxlbWVudFxuICAgICAgICAgICAgaWYgKHZlcnRpY2FsRGlyKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvbnRhaW5lckhlaWdodCA9ICR0aGlzLmhlaWdodCgpO1xuICAgICAgICAgICAgICAgICRtYXJxdWVlV3JhcHBlci5yZW1vdmVBdHRyKCdzdHlsZScpO1xuICAgICAgICAgICAgICAgICR0aGlzLmhlaWdodChjb250YWluZXJIZWlnaHQpO1xuXG4gICAgICAgICAgICAgICAgLy8gQ2hhbmdlIHRoZSBDU1MgZm9yIGpzLW1hcnF1ZWUgZWxlbWVudFxuICAgICAgICAgICAgICAgICR0aGlzLmZpbmQoJy5qcy1tYXJxdWVlJykuY3NzKHtcbiAgICAgICAgICAgICAgICAgICAgJ2Zsb2F0JzogJ25vbmUnLFxuICAgICAgICAgICAgICAgICAgICAnbWFyZ2luLWJvdHRvbSc6IG8uZ2FwLFxuICAgICAgICAgICAgICAgICAgICAnbWFyZ2luLXJpZ2h0JzogMFxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgLy8gUmVtb3ZlIGJvdHRvbSBtYXJnaW4gZnJvbSAybmQgZWxlbWVudCBpZiBkdXBsaWNhdGVkXG4gICAgICAgICAgICAgICAgaWYgKG8uZHVwbGljYXRlZCkgJHRoaXMuZmluZCgnLmpzLW1hcnF1ZWU6bGFzdCcpLmNzcyh7XG4gICAgICAgICAgICAgICAgICAgICdtYXJnaW4tYm90dG9tJzogMFxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgdmFyIGVsSGVpZ2h0ID0gJHRoaXMuZmluZCgnLmpzLW1hcnF1ZWU6Zmlyc3QnKS5oZWlnaHQoKSArIG8uZ2FwO1xuXG4gICAgICAgICAgICAgICAgLy8gYWRqdXN0IHRoZSBhbmltYXRpb24gc3BlZWQgYWNjb3JkaW5nIHRvIHRoZSB0ZXh0IGxlbmd0aFxuICAgICAgICAgICAgICAgIGlmIChvLnN0YXJ0VmlzaWJsZSAmJiAhby5kdXBsaWNhdGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIENvbXB1dGUgdGhlIGNvbXBsZXRlIGFuaW1hdGlvbiBkdXJhdGlvbiBhbmQgc2F2ZSBpdCBmb3IgbGF0ZXIgcmVmZXJlbmNlXG4gICAgICAgICAgICAgICAgICAgIC8vIGZvcm11bGEgaXMgdG86IChIZWlnaHQgb2YgdGhlIHRleHQgbm9kZSArIGhlaWdodCBvZiB0aGUgbWFpbiBjb250YWluZXIgLyBIZWlnaHQgb2YgdGhlIG1haW4gY29udGFpbmVyKSAqIHNwZWVkO1xuICAgICAgICAgICAgICAgICAgICBvLl9jb21wbGV0ZUR1cmF0aW9uID0gKChwYXJzZUludChlbEhlaWdodCwgMTApICsgcGFyc2VJbnQoY29udGFpbmVySGVpZ2h0LCAxMCkpIC8gcGFyc2VJbnQoY29udGFpbmVySGVpZ2h0LCAxMCkpICogby5kdXJhdGlvbjtcblxuICAgICAgICAgICAgICAgICAgICAvLyBmb3JtdWxhIGlzIHRvOiAoSGVpZ2h0IG9mIHRoZSB0ZXh0IG5vZGUgLyBoZWlnaHQgb2YgdGhlIG1haW4gY29udGFpbmVyKSAqIHNwZWVkXG4gICAgICAgICAgICAgICAgICAgIG8uZHVyYXRpb24gPSAocGFyc2VJbnQoZWxIZWlnaHQsIDEwKSAvIHBhcnNlSW50KGNvbnRhaW5lckhlaWdodCwgMTApKSAqIG8uZHVyYXRpb247XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gZm9ybXVsYSBpcyB0bzogKEhlaWdodCBvZiB0aGUgdGV4dCBub2RlICsgaGVpZ2h0IG9mIHRoZSBtYWluIGNvbnRhaW5lciAvIEhlaWdodCBvZiB0aGUgbWFpbiBjb250YWluZXIpICogc3BlZWQ7XG4gICAgICAgICAgICAgICAgICAgIG8uZHVyYXRpb24gPSAoKHBhcnNlSW50KGVsSGVpZ2h0LCAxMCkgKyBwYXJzZUludChjb250YWluZXJIZWlnaHQsIDEwKSkgLyBwYXJzZUludChjb250YWluZXJIZWlnaHQsIDEwKSkgKiBvLmR1cmF0aW9uO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBTYXZlIHRoZSB3aWR0aCBvZiB0aGUgZWFjaCBlbGVtZW50IHNvIHdlIGNhbiB1c2UgaXQgaW4gYW5pbWF0aW9uXG4gICAgICAgICAgICAgICAgZWxXaWR0aCA9ICR0aGlzLmZpbmQoJy5qcy1tYXJxdWVlOmZpcnN0Jykud2lkdGgoKSArIG8uZ2FwO1xuXG4gICAgICAgICAgICAgICAgLy8gY29udGFpbmVyIHdpZHRoXG4gICAgICAgICAgICAgICAgY29udGFpbmVyV2lkdGggPSAkdGhpcy53aWR0aCgpO1xuXG4gICAgICAgICAgICAgICAgLy8gYWRqdXN0IHRoZSBhbmltYXRpb24gc3BlZWQgYWNjb3JkaW5nIHRvIHRoZSB0ZXh0IGxlbmd0aFxuICAgICAgICAgICAgICAgIGlmIChvLnN0YXJ0VmlzaWJsZSAmJiAhby5kdXBsaWNhdGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIENvbXB1dGUgdGhlIGNvbXBsZXRlIGFuaW1hdGlvbiBkdXJhdGlvbiBhbmQgc2F2ZSBpdCBmb3IgbGF0ZXIgcmVmZXJlbmNlXG4gICAgICAgICAgICAgICAgICAgIC8vIGZvcm11bGEgaXMgdG86IChXaWR0aCBvZiB0aGUgdGV4dCBub2RlICsgd2lkdGggb2YgdGhlIG1haW4gY29udGFpbmVyIC8gV2lkdGggb2YgdGhlIG1haW4gY29udGFpbmVyKSAqIHNwZWVkO1xuICAgICAgICAgICAgICAgICAgICBvLl9jb21wbGV0ZUR1cmF0aW9uID0gKChwYXJzZUludChlbFdpZHRoLCAxMCkgKyBwYXJzZUludChjb250YWluZXJXaWR0aCwgMTApKSAvIHBhcnNlSW50KGNvbnRhaW5lcldpZHRoLCAxMCkpICogby5kdXJhdGlvbjtcblxuICAgICAgICAgICAgICAgICAgICAvLyAoV2lkdGggb2YgdGhlIHRleHQgbm9kZSAvIHdpZHRoIG9mIHRoZSBtYWluIGNvbnRhaW5lcikgKiBzcGVlZFxuICAgICAgICAgICAgICAgICAgICBvLmR1cmF0aW9uID0gKHBhcnNlSW50KGVsV2lkdGgsIDEwKSAvIHBhcnNlSW50KGNvbnRhaW5lcldpZHRoLCAxMCkpICogby5kdXJhdGlvbjtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBmb3JtdWxhIGlzIHRvOiAoV2lkdGggb2YgdGhlIHRleHQgbm9kZSArIHdpZHRoIG9mIHRoZSBtYWluIGNvbnRhaW5lciAvIFdpZHRoIG9mIHRoZSBtYWluIGNvbnRhaW5lcikgKiBzcGVlZDtcbiAgICAgICAgICAgICAgICAgICAgby5kdXJhdGlvbiA9ICgocGFyc2VJbnQoZWxXaWR0aCwgMTApICsgcGFyc2VJbnQoY29udGFpbmVyV2lkdGgsIDEwKSkgLyBwYXJzZUludChjb250YWluZXJXaWR0aCwgMTApKSAqIG8uZHVyYXRpb247XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBpZiBkdXBsaWNhdGVkIHRoZW4gcmVkdWNlIHRoZSBzcGVlZFxuICAgICAgICAgICAgaWYgKG8uZHVwbGljYXRlZCkge1xuICAgICAgICAgICAgICAgIG8uZHVyYXRpb24gPSBvLmR1cmF0aW9uIC8gMjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKG8uYWxsb3dDc3MzU3VwcG9ydCkge1xuICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgIGVsbSA9IGRvY3VtZW50LmJvZHkgfHwgZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksXG4gICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbk5hbWUgPSAnbWFycXVlZUFuaW1hdGlvbi0nICsgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMTAwMDAwMDApLFxuICAgICAgICAgICAgICAgICAgICBkb21QcmVmaXhlcyA9ICdXZWJraXQgTW96IE8gbXMgS2h0bWwnLnNwbGl0KCcgJyksXG4gICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvblN0cmluZyA9ICdhbmltYXRpb24nLFxuICAgICAgICAgICAgICAgICAgICBhbmltYXRpb25Dc3MzU3RyID0gJycsXG4gICAgICAgICAgICAgICAgICAgIGtleWZyYW1lU3RyaW5nID0gJyc7XG5cbiAgICAgICAgICAgICAgICAvLyBDaGVjayBjc3MzIHN1cHBvcnRcbiAgICAgICAgICAgICAgICBpZiAoZWxtLnN0eWxlLmFuaW1hdGlvbikge1xuICAgICAgICAgICAgICAgICAgICBrZXlmcmFtZVN0cmluZyA9ICdAa2V5ZnJhbWVzICcgKyBhbmltYXRpb25OYW1lICsgJyAnO1xuICAgICAgICAgICAgICAgICAgICBjc3MzQW5pbWF0aW9uSXNTdXBwb3J0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChjc3MzQW5pbWF0aW9uSXNTdXBwb3J0ZWQgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZG9tUHJlZml4ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbG0uc3R5bGVbZG9tUHJlZml4ZXNbaV0gKyAnQW5pbWF0aW9uTmFtZSddICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcHJlZml4ID0gJy0nICsgZG9tUHJlZml4ZXNbaV0udG9Mb3dlckNhc2UoKSArICctJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmltYXRpb25TdHJpbmcgPSBwcmVmaXggKyBhbmltYXRpb25TdHJpbmc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGxheVN0YXRlID0gcHJlZml4ICsgcGxheVN0YXRlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleWZyYW1lU3RyaW5nID0gJ0AnICsgcHJlZml4ICsgJ2tleWZyYW1lcyAnICsgYW5pbWF0aW9uTmFtZSArICcgJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjc3MzQW5pbWF0aW9uSXNTdXBwb3J0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGNzczNBbmltYXRpb25Jc1N1cHBvcnRlZCkge1xuICAgICAgICAgICAgICAgICAgICBhbmltYXRpb25Dc3MzU3RyID0gYW5pbWF0aW9uTmFtZSArICcgJyArIG8uZHVyYXRpb24gLyAxMDAwICsgJ3MgJyArIG8uZGVsYXlCZWZvcmVTdGFydCAvIDEwMDAgKyAncyBpbmZpbml0ZSAnICsgby5jc3MzZWFzaW5nO1xuICAgICAgICAgICAgICAgICAgICAkdGhpcy5kYXRhKCdjc3MzQW5pbWF0aW9uSXNTdXBwb3J0ZWQnLCB0cnVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBfcmVQb3NpdGlvblZlcnRpY2FsbHkgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAkbWFycXVlZVdyYXBwZXIuY3NzKCdtYXJnaW4tdG9wJywgby5kaXJlY3Rpb24gPT0gJ3VwJyA/IGNvbnRhaW5lckhlaWdodCArICdweCcgOiAnLScgKyBlbEhlaWdodCArICdweCcpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF9yZVBvc2l0aW9uSG9yaXpvbnRhbGx5ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgJG1hcnF1ZWVXcmFwcGVyLmNzcygnbWFyZ2luLWxlZnQnLCBvLmRpcmVjdGlvbiA9PSAnbGVmdCcgPyBjb250YWluZXJXaWR0aCArICdweCcgOiAnLScgKyBlbFdpZHRoICsgJ3B4Jyk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvLyBpZiBkdXBsaWNhdGVkIG9wdGlvbiBpcyBzZXQgdG8gdHJ1ZSB0aGFuIHBvc2l0aW9uIHRoZSB3cmFwcGVyXG4gICAgICAgICAgICBpZiAoby5kdXBsaWNhdGVkKSB7XG4gICAgICAgICAgICAgICAgaWYgKHZlcnRpY2FsRGlyKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChvLnN0YXJ0VmlzaWJsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJG1hcnF1ZWVXcmFwcGVyLmNzcygnbWFyZ2luLXRvcCcsIDApO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgJG1hcnF1ZWVXcmFwcGVyLmNzcygnbWFyZ2luLXRvcCcsIG8uZGlyZWN0aW9uID09ICd1cCcgPyBjb250YWluZXJIZWlnaHQgKyAncHgnIDogJy0nICsgKChlbEhlaWdodCAqIDIpIC0gby5nYXApICsgJ3B4Jyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpZiAoby5zdGFydFZpc2libGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRtYXJxdWVlV3JhcHBlci5jc3MoJ21hcmdpbi1sZWZ0JywgMCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkbWFycXVlZVdyYXBwZXIuY3NzKCdtYXJnaW4tbGVmdCcsIG8uZGlyZWN0aW9uID09ICdsZWZ0JyA/IGNvbnRhaW5lcldpZHRoICsgJ3B4JyA6ICctJyArICgoZWxXaWR0aCAqIDIpIC0gby5nYXApICsgJ3B4Jyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBJZiB0aGUgdGV4dCBzdGFydHMgb3V0IHZpc2libGUgd2UgY2FuIHNraXAgdGhlIHR3byBpbml0aWFsIGxvb3BzXG4gICAgICAgICAgICAgICAgaWYgKCFvLnN0YXJ0VmlzaWJsZSkge1xuICAgICAgICAgICAgICAgICAgbG9vcENvdW50ID0gMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKG8uc3RhcnRWaXNpYmxlKSB7XG4gICAgICAgICAgICAgICAgLy8gV2Ugb25seSBoYXZlIHR3byBkaWZmZXJlbnQgbG9vcHMgaWYgbWFycXVlZSBpcyBkdXBsaWNhdGVkIGFuZCBzdGFydHMgdmlzaWJsZSBcbiAgICAgICAgICAgICAgICBsb29wQ291bnQgPSAyO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAodmVydGljYWxEaXIpIHtcbiAgICAgICAgICAgICAgICAgICAgX3JlUG9zaXRpb25WZXJ0aWNhbGx5KCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgX3JlUG9zaXRpb25Ib3Jpem9udGFsbHkoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEFuaW1hdGUgcmVjdXJzaXZlIG1ldGhvZFxuICAgICAgICAgICAgdmFyIGFuaW1hdGUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAoby5kdXBsaWNhdGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFdoZW4gZHVwbGljYXRlZCwgdGhlIGZpcnN0IGxvb3Agd2lsbCBiZSBzY3JvbGwgbG9uZ2VyIHNvIGRvdWJsZSB0aGUgZHVyYXRpb25cbiAgICAgICAgICAgICAgICAgICAgaWYgKGxvb3BDb3VudCA9PT0gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgby5fb3JpZ2luYWxEdXJhdGlvbiA9IG8uZHVyYXRpb247XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodmVydGljYWxEaXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvLmR1cmF0aW9uID0gby5kaXJlY3Rpb24gPT0gJ3VwJyA/IG8uZHVyYXRpb24gKyAoY29udGFpbmVySGVpZ2h0IC8gKChlbEhlaWdodCkgLyBvLmR1cmF0aW9uKSkgOiBvLmR1cmF0aW9uICogMjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgby5kdXJhdGlvbiA9IG8uZGlyZWN0aW9uID09ICdsZWZ0JyA/IG8uZHVyYXRpb24gKyAoY29udGFpbmVyV2lkdGggLyAoKGVsV2lkdGgpIC8gby5kdXJhdGlvbikpIDogby5kdXJhdGlvbiAqIDI7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBBZGp1c3QgdGhlIGNzczMgYW5pbWF0aW9uIGFzIHdlbGxcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhbmltYXRpb25Dc3MzU3RyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5pbWF0aW9uQ3NzM1N0ciA9IGFuaW1hdGlvbk5hbWUgKyAnICcgKyBvLmR1cmF0aW9uIC8gMTAwMCArICdzICcgKyBvLmRlbGF5QmVmb3JlU3RhcnQgLyAxMDAwICsgJ3MgJyArIG8uY3NzM2Vhc2luZztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGxvb3BDb3VudCsrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vIE9uIDJuZCBsb29wIHRoaW5ncyBiYWNrIHRvIG5vcm1hbCwgbm9ybWFsIGR1cmF0aW9uIGZvciB0aGUgcmVzdCBvZiBhbmltYXRpb25zXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGxvb3BDb3VudCA9PT0gMikge1xuICAgICAgICAgICAgICAgICAgICAgICAgby5kdXJhdGlvbiA9IG8uX29yaWdpbmFsRHVyYXRpb247XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBBZGp1c3QgdGhlIGNzczMgYW5pbWF0aW9uIGFzIHdlbGxcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhbmltYXRpb25Dc3MzU3RyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5pbWF0aW9uTmFtZSA9IGFuaW1hdGlvbk5hbWUgKyAnMCc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5ZnJhbWVTdHJpbmcgPSAkLnRyaW0oa2V5ZnJhbWVTdHJpbmcpICsgJzAgJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmltYXRpb25Dc3MzU3RyID0gYW5pbWF0aW9uTmFtZSArICcgJyArIG8uZHVyYXRpb24gLyAxMDAwICsgJ3MgMHMgaW5maW5pdGUgJyArIG8uY3NzM2Vhc2luZztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGxvb3BDb3VudCsrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHZlcnRpY2FsRGlyKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChvLmR1cGxpY2F0ZWQpIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWRqdXN0IHRoZSBzdGFydGluZyBwb2ludCBvZiBhbmltYXRpb24gb25seSB3aGVuIGZpcnN0IGxvb3BzIGZpbmlzaGVzXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobG9vcENvdW50ID4gMikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRtYXJxdWVlV3JhcHBlci5jc3MoJ21hcmdpbi10b3AnLCBvLmRpcmVjdGlvbiA9PSAndXAnID8gMCA6ICctJyArIGVsSGVpZ2h0ICsgJ3B4Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbkNzcyA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnbWFyZ2luLXRvcCc6IG8uZGlyZWN0aW9uID09ICd1cCcgPyAnLScgKyBlbEhlaWdodCArICdweCcgOiAwXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG8uc3RhcnRWaXNpYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGlzIGxvb3AgbW92ZXMgdGhlIG1hcnF1ZWUgb3V0IG9mIHRoZSBjb250YWluZXJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsb29wQ291bnQgPT09IDIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBZGp1c3QgdGhlIGNzczMgYW5pbWF0aW9uIGFzIHdlbGxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYW5pbWF0aW9uQ3NzM1N0cikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmltYXRpb25Dc3MzU3RyID0gYW5pbWF0aW9uTmFtZSArICcgJyArIG8uZHVyYXRpb24gLyAxMDAwICsgJ3MgJyArIG8uZGVsYXlCZWZvcmVTdGFydCAvIDEwMDAgKyAncyAnICsgby5jc3MzZWFzaW5nO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmltYXRpb25Dc3MgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdtYXJnaW4tdG9wJzogby5kaXJlY3Rpb24gPT0gJ3VwJyA/ICctJyArIGVsSGVpZ2h0ICsgJ3B4JyA6IGNvbnRhaW5lckhlaWdodCArICdweCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvb3BDb3VudCsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChsb29wQ291bnQgPT09IDMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTZXQgdGhlIGR1cmF0aW9uIGZvciB0aGUgYW5pbWF0aW9uIHRoYXQgd2lsbCBydW4gZm9yZXZlclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG8uZHVyYXRpb24gPSBvLl9jb21wbGV0ZUR1cmF0aW9uO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFkanVzdCB0aGUgY3NzMyBhbmltYXRpb24gYXMgd2VsbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhbmltYXRpb25Dc3MzU3RyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmltYXRpb25OYW1lID0gYW5pbWF0aW9uTmFtZSArICcwJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleWZyYW1lU3RyaW5nID0gJC50cmltKGtleWZyYW1lU3RyaW5nKSArICcwICc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmltYXRpb25Dc3MzU3RyID0gYW5pbWF0aW9uTmFtZSArICcgJyArIG8uZHVyYXRpb24gLyAxMDAwICsgJ3MgMHMgaW5maW5pdGUgJyArIG8uY3NzM2Vhc2luZztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgX3JlUG9zaXRpb25WZXJ0aWNhbGx5KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfcmVQb3NpdGlvblZlcnRpY2FsbHkoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbkNzcyA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnbWFyZ2luLXRvcCc6IG8uZGlyZWN0aW9uID09ICd1cCcgPyAnLScgKyAoJG1hcnF1ZWVXcmFwcGVyLmhlaWdodCgpKSArICdweCcgOiBjb250YWluZXJIZWlnaHQgKyAncHgnXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG8uZHVwbGljYXRlZCkge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBBZGp1c3QgdGhlIHN0YXJ0aW5nIHBvaW50IG9mIGFuaW1hdGlvbiBvbmx5IHdoZW4gZmlyc3QgbG9vcHMgZmluaXNoZXNcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsb29wQ291bnQgPiAyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJG1hcnF1ZWVXcmFwcGVyLmNzcygnbWFyZ2luLWxlZnQnLCBvLmRpcmVjdGlvbiA9PSAnbGVmdCcgPyAwIDogJy0nICsgZWxXaWR0aCArICdweCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBhbmltYXRpb25Dc3MgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ21hcmdpbi1sZWZ0Jzogby5kaXJlY3Rpb24gPT0gJ2xlZnQnID8gJy0nICsgZWxXaWR0aCArICdweCcgOiAwXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoby5zdGFydFZpc2libGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoaXMgbG9vcCBtb3ZlcyB0aGUgbWFycXVlZSBvdXQgb2YgdGhlIGNvbnRhaW5lclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxvb3BDb3VudCA9PT0gMikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFkanVzdCB0aGUgY3NzMyBhbmltYXRpb24gYXMgd2VsbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhbmltYXRpb25Dc3MzU3RyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbkNzczNTdHIgPSBhbmltYXRpb25OYW1lICsgJyAnICsgby5kdXJhdGlvbiAvIDEwMDAgKyAncyAnICsgby5kZWxheUJlZm9yZVN0YXJ0IC8gMTAwMCArICdzICcgKyBvLmNzczNlYXNpbmc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbkNzcyA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ21hcmdpbi1sZWZ0Jzogby5kaXJlY3Rpb24gPT0gJ2xlZnQnID8gJy0nICsgZWxXaWR0aCArICdweCcgOiBjb250YWluZXJXaWR0aCArICdweCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvb3BDb3VudCsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChsb29wQ291bnQgPT09IDMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTZXQgdGhlIGR1cmF0aW9uIGZvciB0aGUgYW5pbWF0aW9uIHRoYXQgd2lsbCBydW4gZm9yZXZlclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG8uZHVyYXRpb24gPSBvLl9jb21wbGV0ZUR1cmF0aW9uO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFkanVzdCB0aGUgY3NzMyBhbmltYXRpb24gYXMgd2VsbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhbmltYXRpb25Dc3MzU3RyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbk5hbWUgPSBhbmltYXRpb25OYW1lICsgJzAnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXlmcmFtZVN0cmluZyA9ICQudHJpbShrZXlmcmFtZVN0cmluZykgKyAnMCAnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmltYXRpb25Dc3MzU3RyID0gYW5pbWF0aW9uTmFtZSArICcgJyArIG8uZHVyYXRpb24gLyAxMDAwICsgJ3MgMHMgaW5maW5pdGUgJyArIG8uY3NzM2Vhc2luZztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgX3JlUG9zaXRpb25Ib3Jpem9udGFsbHkoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9yZVBvc2l0aW9uSG9yaXpvbnRhbGx5KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBhbmltYXRpb25Dc3MgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ21hcmdpbi1sZWZ0Jzogby5kaXJlY3Rpb24gPT0gJ2xlZnQnID8gJy0nICsgZWxXaWR0aCArICdweCcgOiBjb250YWluZXJXaWR0aCArICdweCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBmaXJlIGV2ZW50XG4gICAgICAgICAgICAgICAgJHRoaXMudHJpZ2dlcignYmVmb3JlU3RhcnRpbmcnKTtcblxuICAgICAgICAgICAgICAgIC8vIElmIGNzczMgc3VwcG9ydCBpcyBhdmFpbGFibGUgdGhhbiBkbyBpdCB3aXRoIGNzczMsIG90aGVyd2lzZSB1c2UgalF1ZXJ5IGFzIGZhbGxiYWNrXG4gICAgICAgICAgICAgICAgaWYgKGNzczNBbmltYXRpb25Jc1N1cHBvcnRlZCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBBZGQgY3NzMyBhbmltYXRpb24gdG8gdGhlIGVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgJG1hcnF1ZWVXcmFwcGVyLmNzcyhhbmltYXRpb25TdHJpbmcsIGFuaW1hdGlvbkNzczNTdHIpO1xuICAgICAgICAgICAgICAgICAgICB2YXIga2V5ZnJhbWVDc3MgPSBrZXlmcmFtZVN0cmluZyArICcgeyAxMDAlICAnICsgX29ialRvU3RyaW5nKGFuaW1hdGlvbkNzcykgKyAnfScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgJHN0eWxlcyA9ICRtYXJxdWVlV3JhcHBlci5maW5kKCdzdHlsZScpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIE5vdyBhZGQgdGhlIGtleWZyYW1lIGFuaW1hdGlvbiB0byB0aGUgbWFycXVlZSBlbGVtZW50XG4gICAgICAgICAgICAgICAgICAgIGlmICgkc3R5bGVzLmxlbmd0aCAhPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQnVnIGZpeGVkIGZvciBqUXVlcnkgMS4zLnggLSBJbnN0ZWFkIG9mIHVzaW5nIC5sYXN0KCksIHVzZSBmb2xsb3dpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgICRzdHlsZXMuZmlsdGVyKFwiOmxhc3RcIikuaHRtbChrZXlmcmFtZUNzcyk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkKCdoZWFkJykuYXBwZW5kKCc8c3R5bGU+JyArIGtleWZyYW1lQ3NzICsgJzwvc3R5bGU+Jyk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvLyBBbmltYXRpb24gaXRlcmF0aW9uIGV2ZW50XG4gICAgICAgICAgICAgICAgICAgIF9wcmVmaXhlZEV2ZW50KCRtYXJxdWVlV3JhcHBlclswXSwgXCJBbmltYXRpb25JdGVyYXRpb25cIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkdGhpcy50cmlnZ2VyKCdmaW5pc2hlZCcpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgLy8gQW5pbWF0aW9uIHN0b3BwZWRcbiAgICAgICAgICAgICAgICAgICAgX3ByZWZpeGVkRXZlbnQoJG1hcnF1ZWVXcmFwcGVyWzBdLCBcIkFuaW1hdGlvbkVuZFwiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFuaW1hdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICR0aGlzLnRyaWdnZXIoJ2ZpbmlzaGVkJyk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gU3RhcnQgYW5pbWF0aW5nXG4gICAgICAgICAgICAgICAgICAgICRtYXJxdWVlV3JhcHBlci5hbmltYXRlKGFuaW1hdGlvbkNzcywgby5kdXJhdGlvbiwgby5lYXNpbmcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZmlyZSBldmVudFxuICAgICAgICAgICAgICAgICAgICAgICAgJHRoaXMudHJpZ2dlcignZmluaXNoZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFuaW1hdGUgYWdhaW5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvLnBhdXNlT25DeWNsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF9zdGFydEFuaW1hdGlvbldpdGhEZWxheSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmltYXRlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBzYXZlIHRoZSBzdGF0dXNcbiAgICAgICAgICAgICAgICAkdGhpcy5kYXRhKCdydW5uaW5nU3RhdHVzJywgJ3Jlc3VtZWQnKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIC8vIGJpbmQgcGF1c2UgYW5kIHJlc3VtZSBldmVudHNcbiAgICAgICAgICAgICR0aGlzLmJpbmQoJ3BhdXNlJywgbWV0aG9kcy5wYXVzZSk7XG4gICAgICAgICAgICAkdGhpcy5iaW5kKCdyZXN1bWUnLCBtZXRob2RzLnJlc3VtZSk7XG5cbiAgICAgICAgICAgIGlmIChvLnBhdXNlT25Ib3Zlcikge1xuICAgICAgICAgICAgICAgICR0aGlzLmJpbmQoJ21vdXNlZW50ZXIgbW91c2VsZWF2ZScsIG1ldGhvZHMudG9nZ2xlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gSWYgY3NzMyBhbmltYXRpb24gaXMgc3VwcG9ydGVkIHRoYW4gY2FsbCBhbmltYXRlIG1ldGhvZCBhdCBvbmNlXG4gICAgICAgICAgICBpZiAoY3NzM0FuaW1hdGlvbklzU3VwcG9ydGVkICYmIG8uYWxsb3dDc3MzU3VwcG9ydCkge1xuICAgICAgICAgICAgICAgIGFuaW1hdGUoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gU3RhcnRzIHRoZSByZWN1cnNpdmUgbWV0aG9kXG4gICAgICAgICAgICAgICAgX3N0YXJ0QW5pbWF0aW9uV2l0aERlbGF5KCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSk7XG4gICAgfTsgLy8gRW5kIG9mIFBsdWdpblxuICAgIC8vIFB1YmxpYzogcGx1Z2luIGRlZmF1bHRzIG9wdGlvbnNcbiAgICAkLmZuLm1hcnF1ZWUuZGVmYXVsdHMgPSB7XG4gICAgICAgIC8vIElmIHlvdSB3aXNoIHRvIGFsd2F5cyBhbmltYXRlIHVzaW5nIGpRdWVyeVxuICAgICAgICBhbGxvd0NzczNTdXBwb3J0OiB0cnVlLFxuICAgICAgICAvLyB3b3JrcyB3aGVuIGFsbG93Q3NzM1N1cHBvcnQgaXMgc2V0IHRvIHRydWUgLSBmb3IgZnVsbCBsaXN0IHNlZSBodHRwOi8vd3d3LnczLm9yZy9UUi8yMDEzL1dELWNzczMtdHJhbnNpdGlvbnMtMjAxMzExMTkvI3RyYW5zaXRpb24tdGltaW5nLWZ1bmN0aW9uXG4gICAgICAgIGNzczNlYXNpbmc6ICdsaW5lYXInLFxuICAgICAgICAvLyByZXF1aXJlcyBqUXVlcnkgZWFzaW5nIHBsdWdpbi4gRGVmYXVsdCBpcyAnbGluZWFyJ1xuICAgICAgICBlYXNpbmc6ICdsaW5lYXInLFxuICAgICAgICAvLyBwYXVzZSB0aW1lIGJlZm9yZSB0aGUgbmV4dCBhbmltYXRpb24gdHVybiBpbiBtaWxsaXNlY29uZHNcbiAgICAgICAgZGVsYXlCZWZvcmVTdGFydDogMTAwMCxcbiAgICAgICAgLy8gJ2xlZnQnLCAncmlnaHQnLCAndXAnIG9yICdkb3duJ1xuICAgICAgICBkaXJlY3Rpb246ICdsZWZ0JyxcbiAgICAgICAgLy8gdHJ1ZSBvciBmYWxzZSAtIHNob3VsZCB0aGUgbWFycXVlZSBiZSBkdXBsaWNhdGVkIHRvIHNob3cgYW4gZWZmZWN0IG9mIGNvbnRpbnVlcyBmbG93XG4gICAgICAgIGR1cGxpY2F0ZWQ6IGZhbHNlLFxuICAgICAgICAvLyBzcGVlZCBpbiBtaWxsaXNlY29uZHMgb2YgdGhlIG1hcnF1ZWUgaW4gbWlsbGlzZWNvbmRzXG4gICAgICAgIGR1cmF0aW9uOiA1MDAwLFxuICAgICAgICAvLyBnYXAgaW4gcGl4ZWxzIGJldHdlZW4gdGhlIHRpY2tlcnNcbiAgICAgICAgZ2FwOiAyMCxcbiAgICAgICAgLy8gb24gY3ljbGUgcGF1c2UgdGhlIG1hcnF1ZWVcbiAgICAgICAgcGF1c2VPbkN5Y2xlOiBmYWxzZSxcbiAgICAgICAgLy8gb24gaG92ZXIgcGF1c2UgdGhlIG1hcnF1ZWUgLSB1c2luZyBqUXVlcnkgcGx1Z2luIGh0dHBzOi8vZ2l0aHViLmNvbS90b2JpYS9QYXVzZVxuICAgICAgICBwYXVzZU9uSG92ZXI6IGZhbHNlLFxuICAgICAgICAvLyB0aGUgbWFycXVlZSBpcyB2aXNpYmxlIGluaXRpYWxseSBwb3NpdGlvbmVkIG5leHQgdG8gdGhlIGJvcmRlciB0b3dhcmRzIGl0IHdpbGwgYmUgbW92aW5nXG4gICAgICAgIHN0YXJ0VmlzaWJsZTogZmFsc2VcbiAgICB9O1xufSkoalF1ZXJ5KTtcbiJdLCJmaWxlIjoicGx1Z2lucy9qcXVlcnkubWFycXVlZS5qcyJ9
