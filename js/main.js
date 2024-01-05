"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
/*! nouislider - 14.5.0 - 5/11/2020 */
(function (factory) {
  if (typeof define === "function" && define.amd) {
    // AMD. Register as an anonymous module.
    define([], factory);
  } else if ((typeof exports === "undefined" ? "undefined" : _typeof(exports)) === "object") {
    // Node/CommonJS
    module.exports = factory();
  } else {
    // Browser globals
    window.noUiSlider = factory();
  }
})(function () {
  "use strict";

  var VERSION = "14.5.0";

  //region Helper Methods

  function isValidFormatter(entry) {
    return _typeof(entry) === "object" && typeof entry.to === "function" && typeof entry.from === "function";
  }
  function removeElement(el) {
    el.parentElement.removeChild(el);
  }
  function isSet(value) {
    return value !== null && value !== undefined;
  }

  // Bindable version
  function preventDefault(e) {
    e.preventDefault();
  }

  // Removes duplicates from an array.
  function unique(array) {
    return array.filter(function (a) {
      return !this[a] ? this[a] = true : false;
    }, {});
  }

  // Round a value to the closest 'to'.
  function closest(value, to) {
    return Math.round(value / to) * to;
  }

  // Current position of an element relative to the document.
  function offset(elem, orientation) {
    var rect = elem.getBoundingClientRect();
    var doc = elem.ownerDocument;
    var docElem = doc.documentElement;
    var pageOffset = getPageOffset(doc);

    // getBoundingClientRect contains left scroll in Chrome on Android.
    // I haven't found a feature detection that proves this. Worst case
    // scenario on mis-match: the 'tap' feature on horizontal sliders breaks.
    if (/webkit.*Chrome.*Mobile/i.test(navigator.userAgent)) {
      pageOffset.x = 0;
    }
    return orientation ? rect.top + pageOffset.y - docElem.clientTop : rect.left + pageOffset.x - docElem.clientLeft;
  }

  // Checks whether a value is numerical.
  function isNumeric(a) {
    return typeof a === "number" && !isNaN(a) && isFinite(a);
  }

  // Sets a class and removes it after [duration] ms.
  function addClassFor(element, className, duration) {
    if (duration > 0) {
      addClass(element, className);
      setTimeout(function () {
        removeClass(element, className);
      }, duration);
    }
  }

  // Limits a value to 0 - 100
  function limit(a) {
    return Math.max(Math.min(a, 100), 0);
  }

  // Wraps a variable as an array, if it isn't one yet.
  // Note that an input array is returned by reference!
  function asArray(a) {
    return Array.isArray(a) ? a : [a];
  }

  // Counts decimals
  function countDecimals(numStr) {
    numStr = String(numStr);
    var pieces = numStr.split(".");
    return pieces.length > 1 ? pieces[1].length : 0;
  }

  // http://youmightnotneedjquery.com/#add_class
  function addClass(el, className) {
    if (el.classList && !/\s/.test(className)) {
      el.classList.add(className);
    } else {
      el.className += " " + className;
    }
  }

  // http://youmightnotneedjquery.com/#remove_class
  function removeClass(el, className) {
    if (el.classList && !/\s/.test(className)) {
      el.classList.remove(className);
    } else {
      el.className = el.className.replace(new RegExp("(^|\\b)" + className.split(" ").join("|") + "(\\b|$)", "gi"), " ");
    }
  }

  // https://plainjs.com/javascript/attributes/adding-removing-and-testing-for-classes-9/
  function hasClass(el, className) {
    return el.classList ? el.classList.contains(className) : new RegExp("\\b" + className + "\\b").test(el.className);
  }

  // https://developer.mozilla.org/en-US/docs/Web/API/Window/scrollY#Notes
  function getPageOffset(doc) {
    var supportPageOffset = window.pageXOffset !== undefined;
    var isCSS1Compat = (doc.compatMode || "") === "CSS1Compat";
    var x = supportPageOffset ? window.pageXOffset : isCSS1Compat ? doc.documentElement.scrollLeft : doc.body.scrollLeft;
    var y = supportPageOffset ? window.pageYOffset : isCSS1Compat ? doc.documentElement.scrollTop : doc.body.scrollTop;
    return {
      x: x,
      y: y
    };
  }

  // we provide a function to compute constants instead
  // of accessing window.* as soon as the module needs it
  // so that we do not compute anything if not needed
  function getActions() {
    // Determine the events to bind. IE11 implements pointerEvents without
    // a prefix, which breaks compatibility with the IE10 implementation.
    return window.navigator.pointerEnabled ? {
      start: "pointerdown",
      move: "pointermove",
      end: "pointerup"
    } : window.navigator.msPointerEnabled ? {
      start: "MSPointerDown",
      move: "MSPointerMove",
      end: "MSPointerUp"
    } : {
      start: "mousedown touchstart",
      move: "mousemove touchmove",
      end: "mouseup touchend"
    };
  }

  // https://github.com/WICG/EventListenerOptions/blob/gh-pages/explainer.md
  // Issue #785
  function getSupportsPassive() {
    var supportsPassive = false;

    /* eslint-disable */
    try {
      var opts = Object.defineProperty({}, "passive", {
        get: function get() {
          supportsPassive = true;
        }
      });
      window.addEventListener("test", null, opts);
    } catch (e) {}
    /* eslint-enable */

    return supportsPassive;
  }
  function getSupportsTouchActionNone() {
    return window.CSS && CSS.supports && CSS.supports("touch-action", "none");
  }

  //endregion

  //region Range Calculation

  // Determine the size of a sub-range in relation to a full range.
  function subRangeRatio(pa, pb) {
    return 100 / (pb - pa);
  }

  // (percentage) How many percent is this value of this range?
  function fromPercentage(range, value, startRange) {
    return value * 100 / (range[startRange + 1] - range[startRange]);
  }

  // (percentage) Where is this value on this range?
  function toPercentage(range, value) {
    return fromPercentage(range, range[0] < 0 ? value + Math.abs(range[0]) : value - range[0], 0);
  }

  // (value) How much is this percentage on this range?
  function isPercentage(range, value) {
    return value * (range[1] - range[0]) / 100 + range[0];
  }
  function getJ(value, arr) {
    var j = 1;
    while (value >= arr[j]) {
      j += 1;
    }
    return j;
  }

  // (percentage) Input a value, find where, on a scale of 0-100, it applies.
  function toStepping(xVal, xPct, value) {
    if (value >= xVal.slice(-1)[0]) {
      return 100;
    }
    var j = getJ(value, xVal);
    var va = xVal[j - 1];
    var vb = xVal[j];
    var pa = xPct[j - 1];
    var pb = xPct[j];
    return pa + toPercentage([va, vb], value) / subRangeRatio(pa, pb);
  }

  // (value) Input a percentage, find where it is on the specified range.
  function fromStepping(xVal, xPct, value) {
    // There is no range group that fits 100
    if (value >= 100) {
      return xVal.slice(-1)[0];
    }
    var j = getJ(value, xPct);
    var va = xVal[j - 1];
    var vb = xVal[j];
    var pa = xPct[j - 1];
    var pb = xPct[j];
    return isPercentage([va, vb], (value - pa) * subRangeRatio(pa, pb));
  }

  // (percentage) Get the step that applies at a certain value.
  function getStep(xPct, xSteps, snap, value) {
    if (value === 100) {
      return value;
    }
    var j = getJ(value, xPct);
    var a = xPct[j - 1];
    var b = xPct[j];

    // If 'snap' is set, steps are used as fixed points on the slider.
    if (snap) {
      // Find the closest position, a or b.
      if (value - a > (b - a) / 2) {
        return b;
      }
      return a;
    }
    if (!xSteps[j - 1]) {
      return value;
    }
    return xPct[j - 1] + closest(value - xPct[j - 1], xSteps[j - 1]);
  }
  function handleEntryPoint(index, value, that) {
    var percentage;

    // Wrap numerical input in an array.
    if (typeof value === "number") {
      value = [value];
    }

    // Reject any invalid input, by testing whether value is an array.
    if (!Array.isArray(value)) {
      throw new Error("noUiSlider (" + VERSION + "): 'range' contains invalid value.");
    }

    // Covert min/max syntax to 0 and 100.
    if (index === "min") {
      percentage = 0;
    } else if (index === "max") {
      percentage = 100;
    } else {
      percentage = parseFloat(index);
    }

    // Check for correct input.
    if (!isNumeric(percentage) || !isNumeric(value[0])) {
      throw new Error("noUiSlider (" + VERSION + "): 'range' value isn't numeric.");
    }

    // Store values.
    that.xPct.push(percentage);
    that.xVal.push(value[0]);

    // NaN will evaluate to false too, but to keep
    // logging clear, set step explicitly. Make sure
    // not to override the 'step' setting with false.
    if (!percentage) {
      if (!isNaN(value[1])) {
        that.xSteps[0] = value[1];
      }
    } else {
      that.xSteps.push(isNaN(value[1]) ? false : value[1]);
    }
    that.xHighestCompleteStep.push(0);
  }
  function handleStepPoint(i, n, that) {
    // Ignore 'false' stepping.
    if (!n) {
      return;
    }

    // Step over zero-length ranges (#948);
    if (that.xVal[i] === that.xVal[i + 1]) {
      that.xSteps[i] = that.xHighestCompleteStep[i] = that.xVal[i];
      return;
    }

    // Factor to range ratio
    that.xSteps[i] = fromPercentage([that.xVal[i], that.xVal[i + 1]], n, 0) / subRangeRatio(that.xPct[i], that.xPct[i + 1]);
    var totalSteps = (that.xVal[i + 1] - that.xVal[i]) / that.xNumSteps[i];
    var highestStep = Math.ceil(Number(totalSteps.toFixed(3)) - 1);
    var step = that.xVal[i] + that.xNumSteps[i] * highestStep;
    that.xHighestCompleteStep[i] = step;
  }

  //endregion

  //region Spectrum

  function Spectrum(entry, snap, singleStep) {
    this.xPct = [];
    this.xVal = [];
    this.xSteps = [singleStep || false];
    this.xNumSteps = [false];
    this.xHighestCompleteStep = [];
    this.snap = snap;
    var index;
    var ordered = []; // [0, 'min'], [1, '50%'], [2, 'max']

    // Map the object keys to an array.
    for (index in entry) {
      if (entry.hasOwnProperty(index)) {
        ordered.push([entry[index], index]);
      }
    }

    // Sort all entries by value (numeric sort).
    if (ordered.length && _typeof(ordered[0][0]) === "object") {
      ordered.sort(function (a, b) {
        return a[0][0] - b[0][0];
      });
    } else {
      ordered.sort(function (a, b) {
        return a[0] - b[0];
      });
    }

    // Convert all entries to subranges.
    for (index = 0; index < ordered.length; index++) {
      handleEntryPoint(ordered[index][1], ordered[index][0], this);
    }

    // Store the actual step values.
    // xSteps is sorted in the same order as xPct and xVal.
    this.xNumSteps = this.xSteps.slice(0);

    // Convert all numeric steps to the percentage of the subrange they represent.
    for (index = 0; index < this.xNumSteps.length; index++) {
      handleStepPoint(index, this.xNumSteps[index], this);
    }
  }
  Spectrum.prototype.getDistance = function (value) {
    var index;
    var distances = [];
    for (index = 0; index < this.xNumSteps.length - 1; index++) {
      // last "range" can't contain step size as it is purely an endpoint.
      var step = this.xNumSteps[index];
      if (step && value / step % 1 !== 0) {
        throw new Error("noUiSlider (" + VERSION + "): 'limit', 'margin' and 'padding' of " + this.xPct[index] + "% range must be divisible by step.");
      }

      // Calculate percentual distance in current range of limit, margin or padding
      distances[index] = fromPercentage(this.xVal, value, index);
    }
    return distances;
  };

  // Calculate the percentual distance over the whole scale of ranges.
  // direction: 0 = backwards / 1 = forwards
  Spectrum.prototype.getAbsoluteDistance = function (value, distances, direction) {
    var xPct_index = 0;

    // Calculate range where to start calculation
    if (value < this.xPct[this.xPct.length - 1]) {
      while (value > this.xPct[xPct_index + 1]) {
        xPct_index++;
      }
    } else if (value === this.xPct[this.xPct.length - 1]) {
      xPct_index = this.xPct.length - 2;
    }

    // If looking backwards and the value is exactly at a range separator then look one range further
    if (!direction && value === this.xPct[xPct_index + 1]) {
      xPct_index++;
    }
    var start_factor;
    var rest_factor = 1;
    var rest_rel_distance = distances[xPct_index];
    var range_pct = 0;
    var rel_range_distance = 0;
    var abs_distance_counter = 0;
    var range_counter = 0;

    // Calculate what part of the start range the value is
    if (direction) {
      start_factor = (value - this.xPct[xPct_index]) / (this.xPct[xPct_index + 1] - this.xPct[xPct_index]);
    } else {
      start_factor = (this.xPct[xPct_index + 1] - value) / (this.xPct[xPct_index + 1] - this.xPct[xPct_index]);
    }

    // Do until the complete distance across ranges is calculated
    while (rest_rel_distance > 0) {
      // Calculate the percentage of total range
      range_pct = this.xPct[xPct_index + 1 + range_counter] - this.xPct[xPct_index + range_counter];

      // Detect if the margin, padding or limit is larger then the current range and calculate
      if (distances[xPct_index + range_counter] * rest_factor + 100 - start_factor * 100 > 100) {
        // If larger then take the percentual distance of the whole range
        rel_range_distance = range_pct * start_factor;
        // Rest factor of relative percentual distance still to be calculated
        rest_factor = (rest_rel_distance - 100 * start_factor) / distances[xPct_index + range_counter];
        // Set start factor to 1 as for next range it does not apply.
        start_factor = 1;
      } else {
        // If smaller or equal then take the percentual distance of the calculate percentual part of that range
        rel_range_distance = distances[xPct_index + range_counter] * range_pct / 100 * rest_factor;
        // No rest left as the rest fits in current range
        rest_factor = 0;
      }
      if (direction) {
        abs_distance_counter = abs_distance_counter - rel_range_distance;
        // Limit range to first range when distance becomes outside of minimum range
        if (this.xPct.length + range_counter >= 1) {
          range_counter--;
        }
      } else {
        abs_distance_counter = abs_distance_counter + rel_range_distance;
        // Limit range to last range when distance becomes outside of maximum range
        if (this.xPct.length - range_counter >= 1) {
          range_counter++;
        }
      }

      // Rest of relative percentual distance still to be calculated
      rest_rel_distance = distances[xPct_index + range_counter] * rest_factor;
    }
    return value + abs_distance_counter;
  };
  Spectrum.prototype.toStepping = function (value) {
    value = toStepping(this.xVal, this.xPct, value);
    return value;
  };
  Spectrum.prototype.fromStepping = function (value) {
    return fromStepping(this.xVal, this.xPct, value);
  };
  Spectrum.prototype.getStep = function (value) {
    value = getStep(this.xPct, this.xSteps, this.snap, value);
    return value;
  };
  Spectrum.prototype.getDefaultStep = function (value, isDown, size) {
    var j = getJ(value, this.xPct);

    // When at the top or stepping down, look at the previous sub-range
    if (value === 100 || isDown && value === this.xPct[j - 1]) {
      j = Math.max(j - 1, 1);
    }
    return (this.xVal[j] - this.xVal[j - 1]) / size;
  };
  Spectrum.prototype.getNearbySteps = function (value) {
    var j = getJ(value, this.xPct);
    return {
      stepBefore: {
        startValue: this.xVal[j - 2],
        step: this.xNumSteps[j - 2],
        highestStep: this.xHighestCompleteStep[j - 2]
      },
      thisStep: {
        startValue: this.xVal[j - 1],
        step: this.xNumSteps[j - 1],
        highestStep: this.xHighestCompleteStep[j - 1]
      },
      stepAfter: {
        startValue: this.xVal[j],
        step: this.xNumSteps[j],
        highestStep: this.xHighestCompleteStep[j]
      }
    };
  };
  Spectrum.prototype.countStepDecimals = function () {
    var stepDecimals = this.xNumSteps.map(countDecimals);
    return Math.max.apply(null, stepDecimals);
  };

  // Outside testing
  Spectrum.prototype.convert = function (value) {
    return this.getStep(this.toStepping(value));
  };

  //endregion

  //region Options

  /*	Every input option is tested and parsed. This'll prevent
      endless validation in internal methods. These tests are
      structured with an item for every option available. An
      option can be marked as required by setting the 'r' flag.
      The testing function is provided with three arguments:
          - The provided value for the option;
          - A reference to the options object;
          - The name for the option;
       The testing function returns false when an error is detected,
      or true when everything is OK. It can also modify the option
      object, to make sure all values can be correctly looped elsewhere. */

  //region Defaults

  var defaultFormatter = {
    to: function to(value) {
      return value !== undefined && value.toFixed(2);
    },
    from: Number
  };
  var cssClasses = {
    target: "target",
    base: "base",
    origin: "origin",
    handle: "handle",
    handleLower: "handle-lower",
    handleUpper: "handle-upper",
    touchArea: "touch-area",
    horizontal: "horizontal",
    vertical: "vertical",
    background: "background",
    connect: "connect",
    connects: "connects",
    ltr: "ltr",
    rtl: "rtl",
    textDirectionLtr: "txt-dir-ltr",
    textDirectionRtl: "txt-dir-rtl",
    draggable: "draggable",
    drag: "state-drag",
    tap: "state-tap",
    active: "active",
    tooltip: "tooltip",
    pips: "pips",
    pipsHorizontal: "pips-horizontal",
    pipsVertical: "pips-vertical",
    marker: "marker",
    markerHorizontal: "marker-horizontal",
    markerVertical: "marker-vertical",
    markerNormal: "marker-normal",
    markerLarge: "marker-large",
    markerSub: "marker-sub",
    value: "value",
    valueHorizontal: "value-horizontal",
    valueVertical: "value-vertical",
    valueNormal: "value-normal",
    valueLarge: "value-large",
    valueSub: "value-sub"
  };

  //endregion

  function validateFormat(entry) {
    // Any object with a to and from method is supported.
    if (isValidFormatter(entry)) {
      return true;
    }
    throw new Error("noUiSlider (" + VERSION + "): 'format' requires 'to' and 'from' methods.");
  }
  function testStep(parsed, entry) {
    if (!isNumeric(entry)) {
      throw new Error("noUiSlider (" + VERSION + "): 'step' is not numeric.");
    }

    // The step option can still be used to set stepping
    // for linear sliders. Overwritten if set in 'range'.
    parsed.singleStep = entry;
  }
  function testRange(parsed, entry) {
    // Filter incorrect input.
    if (_typeof(entry) !== "object" || Array.isArray(entry)) {
      throw new Error("noUiSlider (" + VERSION + "): 'range' is not an object.");
    }

    // Catch missing start or end.
    if (entry.min === undefined || entry.max === undefined) {
      throw new Error("noUiSlider (" + VERSION + "): Missing 'min' or 'max' in 'range'.");
    }

    // Catch equal start or end.
    if (entry.min === entry.max) {
      throw new Error("noUiSlider (" + VERSION + "): 'range' 'min' and 'max' cannot be equal.");
    }
    parsed.spectrum = new Spectrum(entry, parsed.snap, parsed.singleStep);
  }
  function testStart(parsed, entry) {
    entry = asArray(entry);

    // Validate input. Values aren't tested, as the public .val method
    // will always provide a valid location.
    if (!Array.isArray(entry) || !entry.length) {
      throw new Error("noUiSlider (" + VERSION + "): 'start' option is incorrect.");
    }

    // Store the number of handles.
    parsed.handles = entry.length;

    // When the slider is initialized, the .val method will
    // be called with the start options.
    parsed.start = entry;
  }
  function testSnap(parsed, entry) {
    // Enforce 100% stepping within subranges.
    parsed.snap = entry;
    if (typeof entry !== "boolean") {
      throw new Error("noUiSlider (" + VERSION + "): 'snap' option must be a boolean.");
    }
  }
  function testAnimate(parsed, entry) {
    // Enforce 100% stepping within subranges.
    parsed.animate = entry;
    if (typeof entry !== "boolean") {
      throw new Error("noUiSlider (" + VERSION + "): 'animate' option must be a boolean.");
    }
  }
  function testAnimationDuration(parsed, entry) {
    parsed.animationDuration = entry;
    if (typeof entry !== "number") {
      throw new Error("noUiSlider (" + VERSION + "): 'animationDuration' option must be a number.");
    }
  }
  function testConnect(parsed, entry) {
    var connect = [false];
    var i;

    // Map legacy options
    if (entry === "lower") {
      entry = [true, false];
    } else if (entry === "upper") {
      entry = [false, true];
    }

    // Handle boolean options
    if (entry === true || entry === false) {
      for (i = 1; i < parsed.handles; i++) {
        connect.push(entry);
      }
      connect.push(false);
    }

    // Reject invalid input
    else if (!Array.isArray(entry) || !entry.length || entry.length !== parsed.handles + 1) {
      throw new Error("noUiSlider (" + VERSION + "): 'connect' option doesn't match handle count.");
    } else {
      connect = entry;
    }
    parsed.connect = connect;
  }
  function testOrientation(parsed, entry) {
    // Set orientation to an a numerical value for easy
    // array selection.
    switch (entry) {
      case "horizontal":
        parsed.ort = 0;
        break;
      case "vertical":
        parsed.ort = 1;
        break;
      default:
        throw new Error("noUiSlider (" + VERSION + "): 'orientation' option is invalid.");
    }
  }
  function testMargin(parsed, entry) {
    if (!isNumeric(entry)) {
      throw new Error("noUiSlider (" + VERSION + "): 'margin' option must be numeric.");
    }

    // Issue #582
    if (entry === 0) {
      return;
    }
    parsed.margin = parsed.spectrum.getDistance(entry);
  }
  function testLimit(parsed, entry) {
    if (!isNumeric(entry)) {
      throw new Error("noUiSlider (" + VERSION + "): 'limit' option must be numeric.");
    }
    parsed.limit = parsed.spectrum.getDistance(entry);
    if (!parsed.limit || parsed.handles < 2) {
      throw new Error("noUiSlider (" + VERSION + "): 'limit' option is only supported on linear sliders with 2 or more handles.");
    }
  }
  function testPadding(parsed, entry) {
    var index;
    if (!isNumeric(entry) && !Array.isArray(entry)) {
      throw new Error("noUiSlider (" + VERSION + "): 'padding' option must be numeric or array of exactly 2 numbers.");
    }
    if (Array.isArray(entry) && !(entry.length === 2 || isNumeric(entry[0]) || isNumeric(entry[1]))) {
      throw new Error("noUiSlider (" + VERSION + "): 'padding' option must be numeric or array of exactly 2 numbers.");
    }
    if (entry === 0) {
      return;
    }
    if (!Array.isArray(entry)) {
      entry = [entry, entry];
    }

    // 'getDistance' returns false for invalid values.
    parsed.padding = [parsed.spectrum.getDistance(entry[0]), parsed.spectrum.getDistance(entry[1])];
    for (index = 0; index < parsed.spectrum.xNumSteps.length - 1; index++) {
      // last "range" can't contain step size as it is purely an endpoint.
      if (parsed.padding[0][index] < 0 || parsed.padding[1][index] < 0) {
        throw new Error("noUiSlider (" + VERSION + "): 'padding' option must be a positive number(s).");
      }
    }
    var totalPadding = entry[0] + entry[1];
    var firstValue = parsed.spectrum.xVal[0];
    var lastValue = parsed.spectrum.xVal[parsed.spectrum.xVal.length - 1];
    if (totalPadding / (lastValue - firstValue) > 1) {
      throw new Error("noUiSlider (" + VERSION + "): 'padding' option must not exceed 100% of the range.");
    }
  }
  function testDirection(parsed, entry) {
    // Set direction as a numerical value for easy parsing.
    // Invert connection for RTL sliders, so that the proper
    // handles get the connect/background classes.
    switch (entry) {
      case "ltr":
        parsed.dir = 0;
        break;
      case "rtl":
        parsed.dir = 1;
        break;
      default:
        throw new Error("noUiSlider (" + VERSION + "): 'direction' option was not recognized.");
    }
  }
  function testBehaviour(parsed, entry) {
    // Make sure the input is a string.
    if (typeof entry !== "string") {
      throw new Error("noUiSlider (" + VERSION + "): 'behaviour' must be a string containing options.");
    }

    // Check if the string contains any keywords.
    // None are required.
    var tap = entry.indexOf("tap") >= 0;
    var drag = entry.indexOf("drag") >= 0;
    var fixed = entry.indexOf("fixed") >= 0;
    var snap = entry.indexOf("snap") >= 0;
    var hover = entry.indexOf("hover") >= 0;
    var unconstrained = entry.indexOf("unconstrained") >= 0;
    if (fixed) {
      if (parsed.handles !== 2) {
        throw new Error("noUiSlider (" + VERSION + "): 'fixed' behaviour must be used with 2 handles");
      }

      // Use margin to enforce fixed state
      testMargin(parsed, parsed.start[1] - parsed.start[0]);
    }
    if (unconstrained && (parsed.margin || parsed.limit)) {
      throw new Error("noUiSlider (" + VERSION + "): 'unconstrained' behaviour cannot be used with margin or limit");
    }
    parsed.events = {
      tap: tap || snap,
      drag: drag,
      fixed: fixed,
      snap: snap,
      hover: hover,
      unconstrained: unconstrained
    };
  }
  function testTooltips(parsed, entry) {
    if (entry === false) {
      return;
    }
    if (entry === true) {
      parsed.tooltips = [];
      for (var i = 0; i < parsed.handles; i++) {
        parsed.tooltips.push(true);
      }
    } else {
      parsed.tooltips = asArray(entry);
      if (parsed.tooltips.length !== parsed.handles) {
        throw new Error("noUiSlider (" + VERSION + "): must pass a formatter for all handles.");
      }
      parsed.tooltips.forEach(function (formatter) {
        if (typeof formatter !== "boolean" && (_typeof(formatter) !== "object" || typeof formatter.to !== "function")) {
          throw new Error("noUiSlider (" + VERSION + "): 'tooltips' must be passed a formatter or 'false'.");
        }
      });
    }
  }
  function testAriaFormat(parsed, entry) {
    parsed.ariaFormat = entry;
    validateFormat(entry);
  }
  function testFormat(parsed, entry) {
    parsed.format = entry;
    validateFormat(entry);
  }
  function testKeyboardSupport(parsed, entry) {
    parsed.keyboardSupport = entry;
    if (typeof entry !== "boolean") {
      throw new Error("noUiSlider (" + VERSION + "): 'keyboardSupport' option must be a boolean.");
    }
  }
  function testDocumentElement(parsed, entry) {
    // This is an advanced option. Passed values are used without validation.
    parsed.documentElement = entry;
  }
  function testCssPrefix(parsed, entry) {
    if (typeof entry !== "string" && entry !== false) {
      throw new Error("noUiSlider (" + VERSION + "): 'cssPrefix' must be a string or `false`.");
    }
    parsed.cssPrefix = entry;
  }
  function testCssClasses(parsed, entry) {
    if (_typeof(entry) !== "object") {
      throw new Error("noUiSlider (" + VERSION + "): 'cssClasses' must be an object.");
    }
    if (typeof parsed.cssPrefix === "string") {
      parsed.cssClasses = {};
      for (var key in entry) {
        if (!entry.hasOwnProperty(key)) {
          continue;
        }
        parsed.cssClasses[key] = parsed.cssPrefix + entry[key];
      }
    } else {
      parsed.cssClasses = entry;
    }
  }

  // Test all developer settings and parse to assumption-safe values.
  function testOptions(options) {
    // To prove a fix for #537, freeze options here.
    // If the object is modified, an error will be thrown.
    // Object.freeze(options);

    var parsed = {
      margin: 0,
      limit: 0,
      padding: 0,
      animate: true,
      animationDuration: 300,
      ariaFormat: defaultFormatter,
      format: defaultFormatter
    };

    // Tests are executed in the order they are presented here.
    var tests = {
      step: {
        r: false,
        t: testStep
      },
      start: {
        r: true,
        t: testStart
      },
      connect: {
        r: true,
        t: testConnect
      },
      direction: {
        r: true,
        t: testDirection
      },
      snap: {
        r: false,
        t: testSnap
      },
      animate: {
        r: false,
        t: testAnimate
      },
      animationDuration: {
        r: false,
        t: testAnimationDuration
      },
      range: {
        r: true,
        t: testRange
      },
      orientation: {
        r: false,
        t: testOrientation
      },
      margin: {
        r: false,
        t: testMargin
      },
      limit: {
        r: false,
        t: testLimit
      },
      padding: {
        r: false,
        t: testPadding
      },
      behaviour: {
        r: true,
        t: testBehaviour
      },
      ariaFormat: {
        r: false,
        t: testAriaFormat
      },
      format: {
        r: false,
        t: testFormat
      },
      tooltips: {
        r: false,
        t: testTooltips
      },
      keyboardSupport: {
        r: true,
        t: testKeyboardSupport
      },
      documentElement: {
        r: false,
        t: testDocumentElement
      },
      cssPrefix: {
        r: true,
        t: testCssPrefix
      },
      cssClasses: {
        r: true,
        t: testCssClasses
      }
    };
    var defaults = {
      connect: false,
      direction: "ltr",
      behaviour: "tap",
      orientation: "horizontal",
      keyboardSupport: true,
      cssPrefix: "noUi-",
      cssClasses: cssClasses
    };

    // AriaFormat defaults to regular format, if any.
    if (options.format && !options.ariaFormat) {
      options.ariaFormat = options.format;
    }

    // Run all options through a testing mechanism to ensure correct
    // input. It should be noted that options might get modified to
    // be handled properly. E.g. wrapping integers in arrays.
    Object.keys(tests).forEach(function (name) {
      // If the option isn't set, but it is required, throw an error.
      if (!isSet(options[name]) && defaults[name] === undefined) {
        if (tests[name].r) {
          throw new Error("noUiSlider (" + VERSION + "): '" + name + "' is required.");
        }
        return true;
      }
      tests[name].t(parsed, !isSet(options[name]) ? defaults[name] : options[name]);
    });

    // Forward pips options
    parsed.pips = options.pips;

    // All recent browsers accept unprefixed transform.
    // We need -ms- for IE9 and -webkit- for older Android;
    // Assume use of -webkit- if unprefixed and -ms- are not supported.
    // https://caniuse.com/#feat=transforms2d
    var d = document.createElement("div");
    var msPrefix = d.style.msTransform !== undefined;
    var noPrefix = d.style.transform !== undefined;
    parsed.transformRule = noPrefix ? "transform" : msPrefix ? "msTransform" : "webkitTransform";

    // Pips don't move, so we can place them using left/top.
    var styles = [["left", "top"], ["right", "bottom"]];
    parsed.style = styles[parsed.dir][parsed.ort];
    return parsed;
  }

  //endregion

  function scope(target, options, originalOptions) {
    var actions = getActions();
    var supportsTouchActionNone = getSupportsTouchActionNone();
    var supportsPassive = supportsTouchActionNone && getSupportsPassive();

    // All variables local to 'scope' are prefixed with 'scope_'

    // Slider DOM Nodes
    var scope_Target = target;
    var scope_Base;
    var scope_Handles;
    var scope_Connects;
    var scope_Pips;
    var scope_Tooltips;

    // Slider state values
    var scope_Spectrum = options.spectrum;
    var scope_Values = [];
    var scope_Locations = [];
    var scope_HandleNumbers = [];
    var scope_ActiveHandlesCount = 0;
    var scope_Events = {};

    // Exposed API
    var scope_Self;

    // Document Nodes
    var scope_Document = target.ownerDocument;
    var scope_DocumentElement = options.documentElement || scope_Document.documentElement;
    var scope_Body = scope_Document.body;

    // Pips constants
    var PIPS_NONE = -1;
    var PIPS_NO_VALUE = 0;
    var PIPS_LARGE_VALUE = 1;
    var PIPS_SMALL_VALUE = 2;

    // For horizontal sliders in standard ltr documents,
    // make .noUi-origin overflow to the left so the document doesn't scroll.
    var scope_DirOffset = scope_Document.dir === "rtl" || options.ort === 1 ? 0 : 100;

    // Creates a node, adds it to target, returns the new node.
    function addNodeTo(addTarget, className) {
      var div = scope_Document.createElement("div");
      if (className) {
        addClass(div, className);
      }
      addTarget.appendChild(div);
      return div;
    }

    // Append a origin to the base
    function addOrigin(base, handleNumber) {
      var origin = addNodeTo(base, options.cssClasses.origin);
      var handle = addNodeTo(origin, options.cssClasses.handle);
      addNodeTo(handle, options.cssClasses.touchArea);
      handle.setAttribute("data-handle", handleNumber);
      if (options.keyboardSupport) {
        // https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex
        // 0 = focusable and reachable
        handle.setAttribute("tabindex", "0");
        handle.addEventListener("keydown", function (event) {
          return eventKeydown(event, handleNumber);
        });
      }
      handle.setAttribute("role", "slider");
      handle.setAttribute("aria-orientation", options.ort ? "vertical" : "horizontal");
      if (handleNumber === 0) {
        addClass(handle, options.cssClasses.handleLower);
      } else if (handleNumber === options.handles - 1) {
        addClass(handle, options.cssClasses.handleUpper);
      }
      return origin;
    }

    // Insert nodes for connect elements
    function addConnect(base, add) {
      if (!add) {
        return false;
      }
      return addNodeTo(base, options.cssClasses.connect);
    }

    // Add handles to the slider base.
    function addElements(connectOptions, base) {
      var connectBase = addNodeTo(base, options.cssClasses.connects);
      scope_Handles = [];
      scope_Connects = [];
      scope_Connects.push(addConnect(connectBase, connectOptions[0]));

      // [::::O====O====O====]
      // connectOptions = [0, 1, 1, 1]

      for (var i = 0; i < options.handles; i++) {
        // Keep a list of all added handles.
        scope_Handles.push(addOrigin(base, i));
        scope_HandleNumbers[i] = i;
        scope_Connects.push(addConnect(connectBase, connectOptions[i + 1]));
      }
    }

    // Initialize a single slider.
    function addSlider(addTarget) {
      // Apply classes and data to the target.
      addClass(addTarget, options.cssClasses.target);
      if (options.dir === 0) {
        addClass(addTarget, options.cssClasses.ltr);
      } else {
        addClass(addTarget, options.cssClasses.rtl);
      }
      if (options.ort === 0) {
        addClass(addTarget, options.cssClasses.horizontal);
      } else {
        addClass(addTarget, options.cssClasses.vertical);
      }
      var textDirection = getComputedStyle(addTarget).direction;
      if (textDirection === "rtl") {
        addClass(addTarget, options.cssClasses.textDirectionRtl);
      } else {
        addClass(addTarget, options.cssClasses.textDirectionLtr);
      }
      return addNodeTo(addTarget, options.cssClasses.base);
    }
    function addTooltip(handle, handleNumber) {
      if (!options.tooltips[handleNumber]) {
        return false;
      }
      return addNodeTo(handle.firstChild, options.cssClasses.tooltip);
    }
    function isSliderDisabled() {
      return scope_Target.hasAttribute("disabled");
    }

    // Disable the slider dragging if any handle is disabled
    function isHandleDisabled(handleNumber) {
      var handleOrigin = scope_Handles[handleNumber];
      return handleOrigin.hasAttribute("disabled");
    }
    function removeTooltips() {
      if (scope_Tooltips) {
        removeEvent("update.tooltips");
        scope_Tooltips.forEach(function (tooltip) {
          if (tooltip) {
            removeElement(tooltip);
          }
        });
        scope_Tooltips = null;
      }
    }

    // The tooltips option is a shorthand for using the 'update' event.
    function tooltips() {
      removeTooltips();

      // Tooltips are added with options.tooltips in original order.
      scope_Tooltips = scope_Handles.map(addTooltip);
      bindEvent("update.tooltips", function (values, handleNumber, unencoded) {
        if (!scope_Tooltips[handleNumber]) {
          return;
        }
        var formattedValue = values[handleNumber];
        if (options.tooltips[handleNumber] !== true) {
          formattedValue = options.tooltips[handleNumber].to(unencoded[handleNumber]);
        }
        scope_Tooltips[handleNumber].innerHTML = formattedValue;
      });
    }
    function aria() {
      bindEvent("update", function (values, handleNumber, unencoded, tap, positions) {
        // Update Aria Values for all handles, as a change in one changes min and max values for the next.
        scope_HandleNumbers.forEach(function (index) {
          var handle = scope_Handles[index];
          var min = checkHandlePosition(scope_Locations, index, 0, true, true, true);
          var max = checkHandlePosition(scope_Locations, index, 100, true, true, true);
          var now = positions[index];

          // Formatted value for display
          var text = options.ariaFormat.to(unencoded[index]);

          // Map to slider range values
          min = scope_Spectrum.fromStepping(min).toFixed(1);
          max = scope_Spectrum.fromStepping(max).toFixed(1);
          now = scope_Spectrum.fromStepping(now).toFixed(1);
          handle.children[0].setAttribute("aria-valuemin", min);
          handle.children[0].setAttribute("aria-valuemax", max);
          handle.children[0].setAttribute("aria-valuenow", now);
          handle.children[0].setAttribute("aria-valuetext", text);
        });
      });
    }
    function getGroup(mode, values, stepped) {
      // Use the range.
      if (mode === "range" || mode === "steps") {
        return scope_Spectrum.xVal;
      }
      if (mode === "count") {
        if (values < 2) {
          throw new Error("noUiSlider (" + VERSION + "): 'values' (>= 2) required for mode 'count'.");
        }

        // Divide 0 - 100 in 'count' parts.
        var interval = values - 1;
        var spread = 100 / interval;
        values = [];

        // List these parts and have them handled as 'positions'.
        while (interval--) {
          values[interval] = interval * spread;
        }
        values.push(100);
        mode = "positions";
      }
      if (mode === "positions") {
        // Map all percentages to on-range values.
        return values.map(function (value) {
          return scope_Spectrum.fromStepping(stepped ? scope_Spectrum.getStep(value) : value);
        });
      }
      if (mode === "values") {
        // If the value must be stepped, it needs to be converted to a percentage first.
        if (stepped) {
          return values.map(function (value) {
            // Convert to percentage, apply step, return to value.
            return scope_Spectrum.fromStepping(scope_Spectrum.getStep(scope_Spectrum.toStepping(value)));
          });
        }

        // Otherwise, we can simply use the values.
        return values;
      }
    }
    function generateSpread(density, mode, group) {
      function safeIncrement(value, increment) {
        // Avoid floating point variance by dropping the smallest decimal places.
        return (value + increment).toFixed(7) / 1;
      }
      var indexes = {};
      var firstInRange = scope_Spectrum.xVal[0];
      var lastInRange = scope_Spectrum.xVal[scope_Spectrum.xVal.length - 1];
      var ignoreFirst = false;
      var ignoreLast = false;
      var prevPct = 0;

      // Create a copy of the group, sort it and filter away all duplicates.
      group = unique(group.slice().sort(function (a, b) {
        return a - b;
      }));

      // Make sure the range starts with the first element.
      if (group[0] !== firstInRange) {
        group.unshift(firstInRange);
        ignoreFirst = true;
      }

      // Likewise for the last one.
      if (group[group.length - 1] !== lastInRange) {
        group.push(lastInRange);
        ignoreLast = true;
      }
      group.forEach(function (current, index) {
        // Get the current step and the lower + upper positions.
        var step;
        var i;
        var q;
        var low = current;
        var high = group[index + 1];
        var newPct;
        var pctDifference;
        var pctPos;
        var type;
        var steps;
        var realSteps;
        var stepSize;
        var isSteps = mode === "steps";

        // When using 'steps' mode, use the provided steps.
        // Otherwise, we'll step on to the next subrange.
        if (isSteps) {
          step = scope_Spectrum.xNumSteps[index];
        }

        // Default to a 'full' step.
        if (!step) {
          step = high - low;
        }

        // Low can be 0, so test for false. If high is undefined,
        // we are at the last subrange. Index 0 is already handled.
        if (low === false || high === undefined) {
          return;
        }

        // Make sure step isn't 0, which would cause an infinite loop (#654)
        step = Math.max(step, 0.0000001);

        // Find all steps in the subrange.
        for (i = low; i <= high; i = safeIncrement(i, step)) {
          // Get the percentage value for the current step,
          // calculate the size for the subrange.
          newPct = scope_Spectrum.toStepping(i);
          pctDifference = newPct - prevPct;
          steps = pctDifference / density;
          realSteps = Math.round(steps);

          // This ratio represents the amount of percentage-space a point indicates.
          // For a density 1 the points/percentage = 1. For density 2, that percentage needs to be re-divided.
          // Round the percentage offset to an even number, then divide by two
          // to spread the offset on both sides of the range.
          stepSize = pctDifference / realSteps;

          // Divide all points evenly, adding the correct number to this subrange.
          // Run up to <= so that 100% gets a point, event if ignoreLast is set.
          for (q = 1; q <= realSteps; q += 1) {
            // The ratio between the rounded value and the actual size might be ~1% off.
            // Correct the percentage offset by the number of points
            // per subrange. density = 1 will result in 100 points on the
            // full range, 2 for 50, 4 for 25, etc.
            pctPos = prevPct + q * stepSize;
            indexes[pctPos.toFixed(5)] = [scope_Spectrum.fromStepping(pctPos), 0];
          }

          // Determine the point type.
          type = group.indexOf(i) > -1 ? PIPS_LARGE_VALUE : isSteps ? PIPS_SMALL_VALUE : PIPS_NO_VALUE;

          // Enforce the 'ignoreFirst' option by overwriting the type for 0.
          if (!index && ignoreFirst && i !== high) {
            type = 0;
          }
          if (!(i === high && ignoreLast)) {
            // Mark the 'type' of this point. 0 = plain, 1 = real value, 2 = step value.
            indexes[newPct.toFixed(5)] = [i, type];
          }

          // Update the percentage count.
          prevPct = newPct;
        }
      });
      return indexes;
    }
    function addMarking(spread, filterFunc, formatter) {
      var element = scope_Document.createElement("div");
      var valueSizeClasses = [];
      valueSizeClasses[PIPS_NO_VALUE] = options.cssClasses.valueNormal;
      valueSizeClasses[PIPS_LARGE_VALUE] = options.cssClasses.valueLarge;
      valueSizeClasses[PIPS_SMALL_VALUE] = options.cssClasses.valueSub;
      var markerSizeClasses = [];
      markerSizeClasses[PIPS_NO_VALUE] = options.cssClasses.markerNormal;
      markerSizeClasses[PIPS_LARGE_VALUE] = options.cssClasses.markerLarge;
      markerSizeClasses[PIPS_SMALL_VALUE] = options.cssClasses.markerSub;
      var valueOrientationClasses = [options.cssClasses.valueHorizontal, options.cssClasses.valueVertical];
      var markerOrientationClasses = [options.cssClasses.markerHorizontal, options.cssClasses.markerVertical];
      addClass(element, options.cssClasses.pips);
      addClass(element, options.ort === 0 ? options.cssClasses.pipsHorizontal : options.cssClasses.pipsVertical);
      function getClasses(type, source) {
        var a = source === options.cssClasses.value;
        var orientationClasses = a ? valueOrientationClasses : markerOrientationClasses;
        var sizeClasses = a ? valueSizeClasses : markerSizeClasses;
        return source + " " + orientationClasses[options.ort] + " " + sizeClasses[type];
      }
      function addSpread(offset, value, type) {
        // Apply the filter function, if it is set.
        type = filterFunc ? filterFunc(value, type) : type;
        if (type === PIPS_NONE) {
          return;
        }

        // Add a marker for every point
        var node = addNodeTo(element, false);
        node.className = getClasses(type, options.cssClasses.marker);
        node.style[options.style] = offset + "%";

        // Values are only appended for points marked '1' or '2'.
        if (type > PIPS_NO_VALUE) {
          node = addNodeTo(element, false);
          node.className = getClasses(type, options.cssClasses.value);
          node.setAttribute("data-value", value);
          node.style[options.style] = offset + "%";
          node.innerHTML = formatter.to(value);
        }
      }

      // Append all points.
      Object.keys(spread).forEach(function (offset) {
        addSpread(offset, spread[offset][0], spread[offset][1]);
      });
      return element;
    }
    function removePips() {
      if (scope_Pips) {
        removeElement(scope_Pips);
        scope_Pips = null;
      }
    }
    function pips(grid) {
      // Fix #669
      removePips();
      var mode = grid.mode;
      var density = grid.density || 1;
      var filter = grid.filter || false;
      var values = grid.values || false;
      var stepped = grid.stepped || false;
      var group = getGroup(mode, values, stepped);
      var spread = generateSpread(density, mode, group);
      var format = grid.format || {
        to: Math.round
      };
      scope_Pips = scope_Target.appendChild(addMarking(spread, filter, format));
      return scope_Pips;
    }

    // Shorthand for base dimensions.
    function baseSize() {
      var rect = scope_Base.getBoundingClientRect();
      var alt = "offset" + ["Width", "Height"][options.ort];
      return options.ort === 0 ? rect.width || scope_Base[alt] : rect.height || scope_Base[alt];
    }

    // Handler for attaching events trough a proxy.
    function attachEvent(events, element, callback, data) {
      // This function can be used to 'filter' events to the slider.
      // element is a node, not a nodeList

      var method = function method(e) {
        e = fixEvent(e, data.pageOffset, data.target || element);

        // fixEvent returns false if this event has a different target
        // when handling (multi-) touch events;
        if (!e) {
          return false;
        }

        // doNotReject is passed by all end events to make sure released touches
        // are not rejected, leaving the slider "stuck" to the cursor;
        if (isSliderDisabled() && !data.doNotReject) {
          return false;
        }

        // Stop if an active 'tap' transition is taking place.
        if (hasClass(scope_Target, options.cssClasses.tap) && !data.doNotReject) {
          return false;
        }

        // Ignore right or middle clicks on start #454
        if (events === actions.start && e.buttons !== undefined && e.buttons > 1) {
          return false;
        }

        // Ignore right or middle clicks on start #454
        if (data.hover && e.buttons) {
          return false;
        }

        // 'supportsPassive' is only true if a browser also supports touch-action: none in CSS.
        // iOS safari does not, so it doesn't get to benefit from passive scrolling. iOS does support
        // touch-action: manipulation, but that allows panning, which breaks
        // sliders after zooming/on non-responsive pages.
        // See: https://bugs.webkit.org/show_bug.cgi?id=133112
        if (!supportsPassive) {
          e.preventDefault();
        }
        e.calcPoint = e.points[options.ort];

        // Call the event handler with the event [ and additional data ].
        callback(e, data);
      };
      var methods = [];

      // Bind a closure on the target for every event type.
      events.split(" ").forEach(function (eventName) {
        element.addEventListener(eventName, method, supportsPassive ? {
          passive: true
        } : false);
        methods.push([eventName, method]);
      });
      return methods;
    }

    // Provide a clean event with standardized offset values.
    function fixEvent(e, pageOffset, eventTarget) {
      // Filter the event to register the type, which can be
      // touch, mouse or pointer. Offset changes need to be
      // made on an event specific basis.
      var touch = e.type.indexOf("touch") === 0;
      var mouse = e.type.indexOf("mouse") === 0;
      var pointer = e.type.indexOf("pointer") === 0;
      var x;
      var y;

      // IE10 implemented pointer events with a prefix;
      if (e.type.indexOf("MSPointer") === 0) {
        pointer = true;
      }

      // The only thing one handle should be concerned about is the touches that originated on top of it.
      if (touch) {
        // Returns true if a touch originated on the target.
        var isTouchOnTarget = function isTouchOnTarget(checkTouch) {
          return checkTouch.target === eventTarget || eventTarget.contains(checkTouch.target) || checkTouch.target.shadowRoot && checkTouch.target.shadowRoot.contains(eventTarget);
        };

        // In the case of touchstart events, we need to make sure there is still no more than one
        // touch on the target so we look amongst all touches.
        if (e.type === "touchstart") {
          var targetTouches = Array.prototype.filter.call(e.touches, isTouchOnTarget);

          // Do not support more than one touch per handle.
          if (targetTouches.length > 1) {
            return false;
          }
          x = targetTouches[0].pageX;
          y = targetTouches[0].pageY;
        } else {
          // In the other cases, find on changedTouches is enough.
          var targetTouch = Array.prototype.find.call(e.changedTouches, isTouchOnTarget);

          // Cancel if the target touch has not moved.
          if (!targetTouch) {
            return false;
          }
          x = targetTouch.pageX;
          y = targetTouch.pageY;
        }
      }
      pageOffset = pageOffset || getPageOffset(scope_Document);
      if (mouse || pointer) {
        x = e.clientX + pageOffset.x;
        y = e.clientY + pageOffset.y;
      }
      e.pageOffset = pageOffset;
      e.points = [x, y];
      e.cursor = mouse || pointer; // Fix #435

      return e;
    }

    // Translate a coordinate in the document to a percentage on the slider
    function calcPointToPercentage(calcPoint) {
      var location = calcPoint - offset(scope_Base, options.ort);
      var proposal = location * 100 / baseSize();

      // Clamp proposal between 0% and 100%
      // Out-of-bound coordinates may occur when .noUi-base pseudo-elements
      // are used (e.g. contained handles feature)
      proposal = limit(proposal);
      return options.dir ? 100 - proposal : proposal;
    }

    // Find handle closest to a certain percentage on the slider
    function getClosestHandle(clickedPosition) {
      var smallestDifference = 100;
      var handleNumber = false;
      scope_Handles.forEach(function (handle, index) {
        // Disabled handles are ignored
        if (isHandleDisabled(index)) {
          return;
        }
        var handlePosition = scope_Locations[index];
        var differenceWithThisHandle = Math.abs(handlePosition - clickedPosition);

        // Initial state
        var clickAtEdge = differenceWithThisHandle === 100 && smallestDifference === 100;

        // Difference with this handle is smaller than the previously checked handle
        var isCloser = differenceWithThisHandle < smallestDifference;
        var isCloserAfter = differenceWithThisHandle <= smallestDifference && clickedPosition > handlePosition;
        if (isCloser || isCloserAfter || clickAtEdge) {
          handleNumber = index;
          smallestDifference = differenceWithThisHandle;
        }
      });
      return handleNumber;
    }

    // Fire 'end' when a mouse or pen leaves the document.
    function documentLeave(event, data) {
      if (event.type === "mouseout" && event.target.nodeName === "HTML" && event.relatedTarget === null) {
        eventEnd(event, data);
      }
    }

    // Handle movement on document for handle and range drag.
    function eventMove(event, data) {
      // Fix #498
      // Check value of .buttons in 'start' to work around a bug in IE10 mobile (data.buttonsProperty).
      // https://connect.microsoft.com/IE/feedback/details/927005/mobile-ie10-windows-phone-buttons-property-of-pointermove-event-always-zero
      // IE9 has .buttons and .which zero on mousemove.
      // Firefox breaks the spec MDN defines.
      if (navigator.appVersion.indexOf("MSIE 9") === -1 && event.buttons === 0 && data.buttonsProperty !== 0) {
        return eventEnd(event, data);
      }

      // Check if we are moving up or down
      var movement = (options.dir ? -1 : 1) * (event.calcPoint - data.startCalcPoint);

      // Convert the movement into a percentage of the slider width/height
      var proposal = movement * 100 / data.baseSize;
      moveHandles(movement > 0, proposal, data.locations, data.handleNumbers);
    }

    // Unbind move events on document, call callbacks.
    function eventEnd(event, data) {
      // The handle is no longer active, so remove the class.
      if (data.handle) {
        removeClass(data.handle, options.cssClasses.active);
        scope_ActiveHandlesCount -= 1;
      }

      // Unbind the move and end events, which are added on 'start'.
      data.listeners.forEach(function (c) {
        scope_DocumentElement.removeEventListener(c[0], c[1]);
      });
      if (scope_ActiveHandlesCount === 0) {
        // Remove dragging class.
        removeClass(scope_Target, options.cssClasses.drag);
        setZindex();

        // Remove cursor styles and text-selection events bound to the body.
        if (event.cursor) {
          scope_Body.style.cursor = "";
          scope_Body.removeEventListener("selectstart", preventDefault);
        }
      }
      data.handleNumbers.forEach(function (handleNumber) {
        fireEvent("change", handleNumber);
        fireEvent("set", handleNumber);
        fireEvent("end", handleNumber);
      });
    }

    // Bind move events on document.
    function eventStart(event, data) {
      // Ignore event if any handle is disabled
      if (data.handleNumbers.some(isHandleDisabled)) {
        return false;
      }
      var handle;
      if (data.handleNumbers.length === 1) {
        var handleOrigin = scope_Handles[data.handleNumbers[0]];
        handle = handleOrigin.children[0];
        scope_ActiveHandlesCount += 1;

        // Mark the handle as 'active' so it can be styled.
        addClass(handle, options.cssClasses.active);
      }

      // A drag should never propagate up to the 'tap' event.
      event.stopPropagation();

      // Record the event listeners.
      var listeners = [];

      // Attach the move and end events.
      var moveEvent = attachEvent(actions.move, scope_DocumentElement, eventMove, {
        // The event target has changed so we need to propagate the original one so that we keep
        // relying on it to extract target touches.
        target: event.target,
        handle: handle,
        listeners: listeners,
        startCalcPoint: event.calcPoint,
        baseSize: baseSize(),
        pageOffset: event.pageOffset,
        handleNumbers: data.handleNumbers,
        buttonsProperty: event.buttons,
        locations: scope_Locations.slice()
      });
      var endEvent = attachEvent(actions.end, scope_DocumentElement, eventEnd, {
        target: event.target,
        handle: handle,
        listeners: listeners,
        doNotReject: true,
        handleNumbers: data.handleNumbers
      });
      var outEvent = attachEvent("mouseout", scope_DocumentElement, documentLeave, {
        target: event.target,
        handle: handle,
        listeners: listeners,
        doNotReject: true,
        handleNumbers: data.handleNumbers
      });

      // We want to make sure we pushed the listeners in the listener list rather than creating
      // a new one as it has already been passed to the event handlers.
      listeners.push.apply(listeners, moveEvent.concat(endEvent, outEvent));

      // Text selection isn't an issue on touch devices,
      // so adding cursor styles can be skipped.
      if (event.cursor) {
        // Prevent the 'I' cursor and extend the range-drag cursor.
        scope_Body.style.cursor = getComputedStyle(event.target).cursor;

        // Mark the target with a dragging state.
        if (scope_Handles.length > 1) {
          addClass(scope_Target, options.cssClasses.drag);
        }

        // Prevent text selection when dragging the handles.
        // In noUiSlider <= 9.2.0, this was handled by calling preventDefault on mouse/touch start/move,
        // which is scroll blocking. The selectstart event is supported by FireFox starting from version 52,
        // meaning the only holdout is iOS Safari. This doesn't matter: text selection isn't triggered there.
        // The 'cursor' flag is false.
        // See: http://caniuse.com/#search=selectstart
        scope_Body.addEventListener("selectstart", preventDefault, false);
      }
      data.handleNumbers.forEach(function (handleNumber) {
        fireEvent("start", handleNumber);
      });
    }

    // Move closest handle to tapped location.
    function eventTap(event) {
      // The tap event shouldn't propagate up
      event.stopPropagation();
      var proposal = calcPointToPercentage(event.calcPoint);
      var handleNumber = getClosestHandle(proposal);

      // Tackle the case that all handles are 'disabled'.
      if (handleNumber === false) {
        return false;
      }

      // Flag the slider as it is now in a transitional state.
      // Transition takes a configurable amount of ms (default 300). Re-enable the slider after that.
      if (!options.events.snap) {
        addClassFor(scope_Target, options.cssClasses.tap, options.animationDuration);
      }
      setHandle(handleNumber, proposal, true, true);
      setZindex();
      fireEvent("slide", handleNumber, true);
      fireEvent("update", handleNumber, true);
      fireEvent("change", handleNumber, true);
      fireEvent("set", handleNumber, true);
      if (options.events.snap) {
        eventStart(event, {
          handleNumbers: [handleNumber]
        });
      }
    }

    // Fires a 'hover' event for a hovered mouse/pen position.
    function eventHover(event) {
      var proposal = calcPointToPercentage(event.calcPoint);
      var to = scope_Spectrum.getStep(proposal);
      var value = scope_Spectrum.fromStepping(to);
      Object.keys(scope_Events).forEach(function (targetEvent) {
        if ("hover" === targetEvent.split(".")[0]) {
          scope_Events[targetEvent].forEach(function (callback) {
            callback.call(scope_Self, value);
          });
        }
      });
    }

    // Handles keydown on focused handles
    // Don't move the document when pressing arrow keys on focused handles
    function eventKeydown(event, handleNumber) {
      if (isSliderDisabled() || isHandleDisabled(handleNumber)) {
        return false;
      }
      var horizontalKeys = ["Left", "Right"];
      var verticalKeys = ["Down", "Up"];
      var largeStepKeys = ["PageDown", "PageUp"];
      var edgeKeys = ["Home", "End"];
      if (options.dir && !options.ort) {
        // On an right-to-left slider, the left and right keys act inverted
        horizontalKeys.reverse();
      } else if (options.ort && !options.dir) {
        // On a top-to-bottom slider, the up and down keys act inverted
        verticalKeys.reverse();
        largeStepKeys.reverse();
      }

      // Strip "Arrow" for IE compatibility. https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key
      var key = event.key.replace("Arrow", "");
      var isLargeDown = key === largeStepKeys[0];
      var isLargeUp = key === largeStepKeys[1];
      var isDown = key === verticalKeys[0] || key === horizontalKeys[0] || isLargeDown;
      var isUp = key === verticalKeys[1] || key === horizontalKeys[1] || isLargeUp;
      var isMin = key === edgeKeys[0];
      var isMax = key === edgeKeys[1];
      if (!isDown && !isUp && !isMin && !isMax) {
        return true;
      }
      event.preventDefault();
      var to;
      if (isUp || isDown) {
        var multiplier = 5;
        var direction = isDown ? 0 : 1;
        var steps = getNextStepsForHandle(handleNumber);
        var step = steps[direction];

        // At the edge of a slider, do nothing
        if (step === null) {
          return false;
        }

        // No step set, use the default of 10% of the sub-range
        if (step === false) {
          step = scope_Spectrum.getDefaultStep(scope_Locations[handleNumber], isDown, 10);
        }
        if (isLargeUp || isLargeDown) {
          step *= multiplier;
        }

        // Step over zero-length ranges (#948);
        step = Math.max(step, 0.0000001);

        // Decrement for down steps
        step = (isDown ? -1 : 1) * step;
        to = scope_Values[handleNumber] + step;
      } else if (isMax) {
        // End key
        to = options.spectrum.xVal[options.spectrum.xVal.length - 1];
      } else {
        // Home key
        to = options.spectrum.xVal[0];
      }
      setHandle(handleNumber, scope_Spectrum.toStepping(to), true, true);
      fireEvent("slide", handleNumber);
      fireEvent("update", handleNumber);
      fireEvent("change", handleNumber);
      fireEvent("set", handleNumber);
      return false;
    }

    // Attach events to several slider parts.
    function bindSliderEvents(behaviour) {
      // Attach the standard drag event to the handles.
      if (!behaviour.fixed) {
        scope_Handles.forEach(function (handle, index) {
          // These events are only bound to the visual handle
          // element, not the 'real' origin element.
          attachEvent(actions.start, handle.children[0], eventStart, {
            handleNumbers: [index]
          });
        });
      }

      // Attach the tap event to the slider base.
      if (behaviour.tap) {
        attachEvent(actions.start, scope_Base, eventTap, {});
      }

      // Fire hover events
      if (behaviour.hover) {
        attachEvent(actions.move, scope_Base, eventHover, {
          hover: true
        });
      }

      // Make the range draggable.
      if (behaviour.drag) {
        scope_Connects.forEach(function (connect, index) {
          if (connect === false || index === 0 || index === scope_Connects.length - 1) {
            return;
          }
          var handleBefore = scope_Handles[index - 1];
          var handleAfter = scope_Handles[index];
          var eventHolders = [connect];
          addClass(connect, options.cssClasses.draggable);

          // When the range is fixed, the entire range can
          // be dragged by the handles. The handle in the first
          // origin will propagate the start event upward,
          // but it needs to be bound manually on the other.
          if (behaviour.fixed) {
            eventHolders.push(handleBefore.children[0]);
            eventHolders.push(handleAfter.children[0]);
          }
          eventHolders.forEach(function (eventHolder) {
            attachEvent(actions.start, eventHolder, eventStart, {
              handles: [handleBefore, handleAfter],
              handleNumbers: [index - 1, index]
            });
          });
        });
      }
    }

    // Attach an event to this slider, possibly including a namespace
    function bindEvent(namespacedEvent, callback) {
      scope_Events[namespacedEvent] = scope_Events[namespacedEvent] || [];
      scope_Events[namespacedEvent].push(callback);

      // If the event bound is 'update,' fire it immediately for all handles.
      if (namespacedEvent.split(".")[0] === "update") {
        scope_Handles.forEach(function (a, index) {
          fireEvent("update", index);
        });
      }
    }

    // Undo attachment of event
    function removeEvent(namespacedEvent) {
      var event = namespacedEvent && namespacedEvent.split(".")[0];
      var namespace = event && namespacedEvent.substring(event.length);
      Object.keys(scope_Events).forEach(function (bind) {
        var tEvent = bind.split(".")[0];
        var tNamespace = bind.substring(tEvent.length);
        if ((!event || event === tEvent) && (!namespace || namespace === tNamespace)) {
          delete scope_Events[bind];
        }
      });
    }

    // External event handling
    function fireEvent(eventName, handleNumber, tap) {
      Object.keys(scope_Events).forEach(function (targetEvent) {
        var eventType = targetEvent.split(".")[0];
        if (eventName === eventType) {
          scope_Events[targetEvent].forEach(function (callback) {
            callback.call(
            // Use the slider public API as the scope ('this')
            scope_Self,
            // Return values as array, so arg_1[arg_2] is always valid.
            scope_Values.map(options.format.to),
            // Handle index, 0 or 1
            handleNumber,
            // Un-formatted slider values
            scope_Values.slice(),
            // Event is fired by tap, true or false
            tap || false,
            // Left offset of the handle, in relation to the slider
            scope_Locations.slice(),
            // add the slider public API to an accessible parameter when this is unavailable
            scope_Self);
          });
        }
      });
    }

    // Split out the handle positioning logic so the Move event can use it, too
    function checkHandlePosition(reference, handleNumber, to, lookBackward, lookForward, getValue) {
      var distance;

      // For sliders with multiple handles, limit movement to the other handle.
      // Apply the margin option by adding it to the handle positions.
      if (scope_Handles.length > 1 && !options.events.unconstrained) {
        if (lookBackward && handleNumber > 0) {
          distance = scope_Spectrum.getAbsoluteDistance(reference[handleNumber - 1], options.margin, 0);
          to = Math.max(to, distance);
        }
        if (lookForward && handleNumber < scope_Handles.length - 1) {
          distance = scope_Spectrum.getAbsoluteDistance(reference[handleNumber + 1], options.margin, 1);
          to = Math.min(to, distance);
        }
      }

      // The limit option has the opposite effect, limiting handles to a
      // maximum distance from another. Limit must be > 0, as otherwise
      // handles would be unmovable.
      if (scope_Handles.length > 1 && options.limit) {
        if (lookBackward && handleNumber > 0) {
          distance = scope_Spectrum.getAbsoluteDistance(reference[handleNumber - 1], options.limit, 0);
          to = Math.min(to, distance);
        }
        if (lookForward && handleNumber < scope_Handles.length - 1) {
          distance = scope_Spectrum.getAbsoluteDistance(reference[handleNumber + 1], options.limit, 1);
          to = Math.max(to, distance);
        }
      }

      // The padding option keeps the handles a certain distance from the
      // edges of the slider. Padding must be > 0.
      if (options.padding) {
        if (handleNumber === 0) {
          distance = scope_Spectrum.getAbsoluteDistance(0, options.padding[0], 0);
          to = Math.max(to, distance);
        }
        if (handleNumber === scope_Handles.length - 1) {
          distance = scope_Spectrum.getAbsoluteDistance(100, options.padding[1], 1);
          to = Math.min(to, distance);
        }
      }
      to = scope_Spectrum.getStep(to);

      // Limit percentage to the 0 - 100 range
      to = limit(to);

      // Return false if handle can't move
      if (to === reference[handleNumber] && !getValue) {
        return false;
      }
      return to;
    }

    // Uses slider orientation to create CSS rules. a = base value;
    function inRuleOrder(v, a) {
      var o = options.ort;
      return (o ? a : v) + ", " + (o ? v : a);
    }

    // Moves handle(s) by a percentage
    // (bool, % to move, [% where handle started, ...], [index in scope_Handles, ...])
    function moveHandles(upward, proposal, locations, handleNumbers) {
      var proposals = locations.slice();
      var b = [!upward, upward];
      var f = [upward, !upward];

      // Copy handleNumbers so we don't change the dataset
      handleNumbers = handleNumbers.slice();

      // Check to see which handle is 'leading'.
      // If that one can't move the second can't either.
      if (upward) {
        handleNumbers.reverse();
      }

      // Step 1: get the maximum percentage that any of the handles can move
      if (handleNumbers.length > 1) {
        handleNumbers.forEach(function (handleNumber, o) {
          var to = checkHandlePosition(proposals, handleNumber, proposals[handleNumber] + proposal, b[o], f[o], false);

          // Stop if one of the handles can't move.
          if (to === false) {
            proposal = 0;
          } else {
            proposal = to - proposals[handleNumber];
            proposals[handleNumber] = to;
          }
        });
      }

      // If using one handle, check backward AND forward
      else {
        b = f = [true];
      }
      var state = false;

      // Step 2: Try to set the handles with the found percentage
      handleNumbers.forEach(function (handleNumber, o) {
        state = setHandle(handleNumber, locations[handleNumber] + proposal, b[o], f[o]) || state;
      });

      // Step 3: If a handle moved, fire events
      if (state) {
        handleNumbers.forEach(function (handleNumber) {
          fireEvent("update", handleNumber);
          fireEvent("slide", handleNumber);
        });
      }
    }

    // Takes a base value and an offset. This offset is used for the connect bar size.
    // In the initial design for this feature, the origin element was 1% wide.
    // Unfortunately, a rounding bug in Chrome makes it impossible to implement this feature
    // in this manner: https://bugs.chromium.org/p/chromium/issues/detail?id=798223
    function transformDirection(a, b) {
      return options.dir ? 100 - a - b : a;
    }

    // Updates scope_Locations and scope_Values, updates visual state
    function updateHandlePosition(handleNumber, to) {
      // Update locations.
      scope_Locations[handleNumber] = to;

      // Convert the value to the slider stepping/range.
      scope_Values[handleNumber] = scope_Spectrum.fromStepping(to);
      var translation = 10 * (transformDirection(to, 0) - scope_DirOffset);
      var translateRule = "translate(" + inRuleOrder(translation + "%", "0") + ")";
      scope_Handles[handleNumber].style[options.transformRule] = translateRule;
      updateConnect(handleNumber);
      updateConnect(handleNumber + 1);
    }

    // Handles before the slider middle are stacked later = higher,
    // Handles after the middle later is lower
    // [[7] [8] .......... | .......... [5] [4]
    function setZindex() {
      scope_HandleNumbers.forEach(function (handleNumber) {
        var dir = scope_Locations[handleNumber] > 50 ? -1 : 1;
        var zIndex = 3 + (scope_Handles.length + dir * handleNumber);
        scope_Handles[handleNumber].style.zIndex = zIndex;
      });
    }

    // Test suggested values and apply margin, step.
    function setHandle(handleNumber, to, lookBackward, lookForward) {
      to = checkHandlePosition(scope_Locations, handleNumber, to, lookBackward, lookForward, false);
      if (to === false) {
        return false;
      }
      updateHandlePosition(handleNumber, to);
      return true;
    }

    // Updates style attribute for connect nodes
    function updateConnect(index) {
      // Skip connects set to false
      if (!scope_Connects[index]) {
        return;
      }
      var l = 0;
      var h = 100;
      if (index !== 0) {
        l = scope_Locations[index - 1];
      }
      if (index !== scope_Connects.length - 1) {
        h = scope_Locations[index];
      }

      // We use two rules:
      // 'translate' to change the left/top offset;
      // 'scale' to change the width of the element;
      // As the element has a width of 100%, a translation of 100% is equal to 100% of the parent (.noUi-base)
      var connectWidth = h - l;
      var translateRule = "translate(" + inRuleOrder(transformDirection(l, connectWidth) + "%", "0") + ")";
      var scaleRule = "scale(" + inRuleOrder(connectWidth / 100, "1") + ")";
      scope_Connects[index].style[options.transformRule] = translateRule + " " + scaleRule;
    }

    // Parses value passed to .set method. Returns current value if not parse-able.
    function resolveToValue(to, handleNumber) {
      // Setting with null indicates an 'ignore'.
      // Inputting 'false' is invalid.
      if (to === null || to === false || to === undefined) {
        return scope_Locations[handleNumber];
      }

      // If a formatted number was passed, attempt to decode it.
      if (typeof to === "number") {
        to = String(to);
      }
      to = options.format.from(to);
      to = scope_Spectrum.toStepping(to);

      // If parsing the number failed, use the current value.
      if (to === false || isNaN(to)) {
        return scope_Locations[handleNumber];
      }
      return to;
    }

    // Set the slider value.
    function valueSet(input, fireSetEvent) {
      var values = asArray(input);
      var isInit = scope_Locations[0] === undefined;

      // Event fires by default
      fireSetEvent = fireSetEvent === undefined ? true : !!fireSetEvent;

      // Animation is optional.
      // Make sure the initial values were set before using animated placement.
      if (options.animate && !isInit) {
        addClassFor(scope_Target, options.cssClasses.tap, options.animationDuration);
      }

      // First pass, without lookAhead but with lookBackward. Values are set from left to right.
      scope_HandleNumbers.forEach(function (handleNumber) {
        setHandle(handleNumber, resolveToValue(values[handleNumber], handleNumber), true, false);
      });
      var i = scope_HandleNumbers.length === 1 ? 0 : 1;

      // Secondary passes. Now that all base values are set, apply constraints.
      // Iterate all handles to ensure constraints are applied for the entire slider (Issue #1009)
      for (; i < scope_HandleNumbers.length; ++i) {
        scope_HandleNumbers.forEach(function (handleNumber) {
          setHandle(handleNumber, scope_Locations[handleNumber], true, true);
        });
      }
      setZindex();
      scope_HandleNumbers.forEach(function (handleNumber) {
        fireEvent("update", handleNumber);

        // Fire the event only for handles that received a new value, as per #579
        if (values[handleNumber] !== null && fireSetEvent) {
          fireEvent("set", handleNumber);
        }
      });
    }

    // Reset slider to initial values
    function valueReset(fireSetEvent) {
      valueSet(options.start, fireSetEvent);
    }

    // Set value for a single handle
    function valueSetHandle(handleNumber, value, fireSetEvent) {
      // Ensure numeric input
      handleNumber = Number(handleNumber);
      if (!(handleNumber >= 0 && handleNumber < scope_HandleNumbers.length)) {
        throw new Error("noUiSlider (" + VERSION + "): invalid handle number, got: " + handleNumber);
      }

      // Look both backward and forward, since we don't want this handle to "push" other handles (#960);
      setHandle(handleNumber, resolveToValue(value, handleNumber), true, true);
      fireEvent("update", handleNumber);
      if (fireSetEvent) {
        fireEvent("set", handleNumber);
      }
    }

    // Get the slider value.
    function valueGet() {
      var values = scope_Values.map(options.format.to);

      // If only one handle is used, return a single value.
      if (values.length === 1) {
        return values[0];
      }
      return values;
    }

    // Removes classes from the root and empties it.
    function destroy() {
      for (var key in options.cssClasses) {
        if (!options.cssClasses.hasOwnProperty(key)) {
          continue;
        }
        removeClass(scope_Target, options.cssClasses[key]);
      }
      while (scope_Target.firstChild) {
        scope_Target.removeChild(scope_Target.firstChild);
      }
      delete scope_Target.noUiSlider;
    }
    function getNextStepsForHandle(handleNumber) {
      var location = scope_Locations[handleNumber];
      var nearbySteps = scope_Spectrum.getNearbySteps(location);
      var value = scope_Values[handleNumber];
      var increment = nearbySteps.thisStep.step;
      var decrement = null;

      // If snapped, directly use defined step value
      if (options.snap) {
        return [value - nearbySteps.stepBefore.startValue || null, nearbySteps.stepAfter.startValue - value || null];
      }

      // If the next value in this step moves into the next step,
      // the increment is the start of the next step - the current value
      if (increment !== false) {
        if (value + increment > nearbySteps.stepAfter.startValue) {
          increment = nearbySteps.stepAfter.startValue - value;
        }
      }

      // If the value is beyond the starting point
      if (value > nearbySteps.thisStep.startValue) {
        decrement = nearbySteps.thisStep.step;
      } else if (nearbySteps.stepBefore.step === false) {
        decrement = false;
      }

      // If a handle is at the start of a step, it always steps back into the previous step first
      else {
        decrement = value - nearbySteps.stepBefore.highestStep;
      }

      // Now, if at the slider edges, there is no in/decrement
      if (location === 100) {
        increment = null;
      } else if (location === 0) {
        decrement = null;
      }

      // As per #391, the comparison for the decrement step can have some rounding issues.
      var stepDecimals = scope_Spectrum.countStepDecimals();

      // Round per #391
      if (increment !== null && increment !== false) {
        increment = Number(increment.toFixed(stepDecimals));
      }
      if (decrement !== null && decrement !== false) {
        decrement = Number(decrement.toFixed(stepDecimals));
      }
      return [decrement, increment];
    }

    // Get the current step size for the slider.
    function getNextSteps() {
      return scope_HandleNumbers.map(getNextStepsForHandle);
    }

    // Updateable: margin, limit, padding, step, range, animate, snap
    function updateOptions(optionsToUpdate, fireSetEvent) {
      // Spectrum is created using the range, snap, direction and step options.
      // 'snap' and 'step' can be updated.
      // If 'snap' and 'step' are not passed, they should remain unchanged.
      var v = valueGet();
      var updateAble = ["margin", "limit", "padding", "range", "animate", "snap", "step", "format", "pips", "tooltips"];

      // Only change options that we're actually passed to update.
      updateAble.forEach(function (name) {
        // Check for undefined. null removes the value.
        if (optionsToUpdate[name] !== undefined) {
          originalOptions[name] = optionsToUpdate[name];
        }
      });
      var newOptions = testOptions(originalOptions);

      // Load new options into the slider state
      updateAble.forEach(function (name) {
        if (optionsToUpdate[name] !== undefined) {
          options[name] = newOptions[name];
        }
      });
      scope_Spectrum = newOptions.spectrum;

      // Limit, margin and padding depend on the spectrum but are stored outside of it. (#677)
      options.margin = newOptions.margin;
      options.limit = newOptions.limit;
      options.padding = newOptions.padding;

      // Update pips, removes existing.
      if (options.pips) {
        pips(options.pips);
      } else {
        removePips();
      }

      // Update tooltips, removes existing.
      if (options.tooltips) {
        tooltips();
      } else {
        removeTooltips();
      }

      // Invalidate the current positioning so valueSet forces an update.
      scope_Locations = [];
      valueSet(optionsToUpdate.start || v, fireSetEvent);
    }

    // Initialization steps
    function setupSlider() {
      // Create the base element, initialize HTML and set classes.
      // Add handles and connect elements.
      scope_Base = addSlider(scope_Target);
      addElements(options.connect, scope_Base);

      // Attach user events.
      bindSliderEvents(options.events);

      // Use the public value method to set the start values.
      valueSet(options.start);
      if (options.pips) {
        pips(options.pips);
      }
      if (options.tooltips) {
        tooltips();
      }
      aria();
    }
    setupSlider();

    // noinspection JSUnusedGlobalSymbols
    scope_Self = {
      destroy: destroy,
      steps: getNextSteps,
      on: bindEvent,
      off: removeEvent,
      get: valueGet,
      set: valueSet,
      setHandle: valueSetHandle,
      reset: valueReset,
      // Exposed for unit testing, don't use this in your application.
      __moveHandles: function __moveHandles(a, b, c) {
        moveHandles(a, b, scope_Locations, c);
      },
      options: originalOptions,
      // Issue #600, #678
      updateOptions: updateOptions,
      target: scope_Target,
      // Issue #597
      removePips: removePips,
      removeTooltips: removeTooltips,
      getTooltips: function getTooltips() {
        return scope_Tooltips;
      },
      getOrigins: function getOrigins() {
        return scope_Handles;
      },
      pips: pips // Issue #594
    };

    return scope_Self;
  }

  // Run the standard initializer
  function initialize(target, originalOptions) {
    if (!target || !target.nodeName) {
      throw new Error("noUiSlider (" + VERSION + "): create requires a single element, got: " + target);
    }

    // Throw an error if the slider was already initialized.
    if (target.noUiSlider) {
      throw new Error("noUiSlider (" + VERSION + "): Slider was already initialized.");
    }

    // Test the options and create the slider environment;
    var options = testOptions(originalOptions, target);
    var api = scope(target, options, originalOptions);
    target.noUiSlider = api;
    return api;
  }

  // Use an object instead of a function for future expandability;
  return {
    // Exposed for unit testing, don't use this in your application.
    __spectrum: Spectrum,
    version: VERSION,
    // A reference to the default classes, allows global changes.
    // Use the cssClasses option for changes to one slider.
    cssClasses: cssClasses,
    create: initialize
  };
});
!function (e) {
  "function" == typeof define && define.amd ? define([], e) : "object" == (typeof exports === "undefined" ? "undefined" : _typeof(exports)) ? module.exports = e() : window.wNumb = e();
}(function () {
  "use strict";

  var o = ["decimals", "thousand", "mark", "prefix", "suffix", "encoder", "decoder", "negativeBefore", "negative", "edit", "undo"];
  function w(e) {
    return e.split("").reverse().join("");
  }
  function h(e, t) {
    return e.substring(0, t.length) === t;
  }
  function f(e, t, n) {
    if ((e[t] || e[n]) && e[t] === e[n]) throw new Error(t);
  }
  function x(e) {
    return "number" == typeof e && isFinite(e);
  }
  function n(e, t, n, r, i, o, f, u, s, c, a, p) {
    var d,
      l,
      h,
      g = p,
      v = "",
      m = "";
    return o && (p = o(p)), !!x(p) && (!1 !== e && 0 === parseFloat(p.toFixed(e)) && (p = 0), p < 0 && (d = !0, p = Math.abs(p)), !1 !== e && (p = function (e, t) {
      return e = e.toString().split("e"), (+((e = (e = Math.round(+(e[0] + "e" + (e[1] ? +e[1] + t : t)))).toString().split("e"))[0] + "e" + (e[1] ? e[1] - t : -t))).toFixed(t);
    }(p, e)), -1 !== (p = p.toString()).indexOf(".") ? (h = (l = p.split("."))[0], n && (v = n + l[1])) : h = p, t && (h = w((h = w(h).match(/.{1,3}/g)).join(w(t)))), d && u && (m += u), r && (m += r), d && s && (m += s), m += h, m += v, i && (m += i), c && (m = c(m, g)), m);
  }
  function r(e, t, n, r, i, o, f, u, s, c, a, p) {
    var d,
      l = "";
    return a && (p = a(p)), !(!p || "string" != typeof p) && (u && h(p, u) && (p = p.replace(u, ""), d = !0), r && h(p, r) && (p = p.replace(r, "")), s && h(p, s) && (p = p.replace(s, ""), d = !0), i && function (e, t) {
      return e.slice(-1 * t.length) === t;
    }(p, i) && (p = p.slice(0, -1 * i.length)), t && (p = p.split(t).join("")), n && (p = p.replace(n, ".")), d && (l += "-"), "" !== (l = (l += p).replace(/[^0-9\.\-.]/g, "")) && (l = Number(l), f && (l = f(l)), !!x(l) && l));
  }
  function i(e, t, n) {
    var r,
      i = [];
    for (r = 0; r < o.length; r += 1) i.push(e[o[r]]);
    return i.push(n), t.apply("", i);
  }
  return function e(t) {
    if (!(this instanceof e)) return new e(t);
    "object" == _typeof(t) && (t = function (e) {
      var t,
        n,
        r,
        i = {};
      for (void 0 === e.suffix && (e.suffix = e.postfix), t = 0; t < o.length; t += 1) if (void 0 === (r = e[n = o[t]])) "negative" !== n || i.negativeBefore ? "mark" === n && "." !== i.thousand ? i[n] = "." : i[n] = !1 : i[n] = "-";else if ("decimals" === n) {
        if (!(0 <= r && r < 8)) throw new Error(n);
        i[n] = r;
      } else if ("encoder" === n || "decoder" === n || "edit" === n || "undo" === n) {
        if ("function" != typeof r) throw new Error(n);
        i[n] = r;
      } else {
        if ("string" != typeof r) throw new Error(n);
        i[n] = r;
      }
      return f(i, "mark", "thousand"), f(i, "prefix", "negative"), f(i, "prefix", "negativeBefore"), i;
    }(t), this.to = function (e) {
      return i(t, n, e);
    }, this.from = function (e) {
      return i(t, r, e);
    });
  };
});
"use srict";

// УСТАНОВКА ИЗОБРАЖЕНИЯ ФОНОМ
function ibg() {
  var ibg = document.querySelectorAll(".ibg");
  for (var i = 0; i < ibg.length; i++) {
    if (ibg[i].querySelector('img')) {
      ibg[i].style.backgroundImage = 'url(' + ibg[i].querySelector('img').getAttribute('src') + ')';
    }
  }
}
ibg();

// // МЕНЮ БУРГЕР
// const iconMenu = document.querySelector('.menu__icon');
// const menuHeader = document.querySelector('.menu-header__body');

// if (iconMenu) {
//     iconMenu.addEventListener("click", function(event) {
//         document.body.classList.toggle('_lock');
//         iconMenu.classList.toggle('_active');
//         menuHeader.classList.toggle('_active');
//     });
// }

// // ВСПЛЫВАЮЩЕЕ МЕНЮ 
// const iconAction = document.querySelector('.user-header__icon');
// const menuAction = document.querySelector('.user-header__menu');

// iconAction.addEventListener("click", function(event) {
//     menuAction.classList.toggle('_active');
// });

// document.addEventListener("click", function(event) {
//     if(!event.target.closest('.user-header')){
//         menuAction.classList.remove('_active');
//     }
// });

// // УБРАТЬ PLACEHOLDER ПРИ ФОКУСЕ
// const input = document.querySelector('.input');

// input.addEventListener("focus", function(event) {
//     input.placeholder = "";
// });

// input.addEventListener("blur", function(event) {
//     input.placeholder = "enter your email...";
// });

// // ПРОКРУТКА СТРАНИЦЫ
// const buttonScrollTo = document.querySelector('.main-screen__button');
// const arrowScrollTo = document.querySelector('.main-screen__arrow');
// const content = document.querySelector('.content');

// buttonScrollTo.addEventListener("click", function(event) {
//     event.preventDefault();
//     window.scrollTo({
//         top: content.offsetTop,
//         behavior: "smooth"
//   });
// });

// arrowScrollTo.addEventListener("click", function(event) {
//     event.preventDefault();
//     window.scrollTo({
//         top: content.offsetTop,
//         behavior: "smooth"
//   });
// });

// // СПОЙЛЕР
// $(document).ready(function () {
//     $('.block__title').click(function(e) {
//         if($('.block').hasClass('one')) {
//             $('.block__title').not($(this)).removeClass('active');
//             $('.block__text').not($(this).next()).slideUp(300);
//         }
//         $(this).toggleClass('active').next().slideToggle(300);
//     });
// });

// // ОПРЕДЕЛЕНИЕ ТИПА УСТРОЙСТВА
// const isMobile = {
//     Android: function () {
//         return navigator.userAgent.match(/Android/i);
//     },
//     BlackBerry: function () {
//         return navigator.userAgent.match(/BlackBerry/i);
//     },
//     IOS: function () {
//         return navigator.userAgent.match(/iPhone|iPad|iPod/i);
//     },
//     Opera: function () {
//         return navigator.userAgent.match(/Opera Mini/i);
//     },
//     Windows: function () {
//         return navigator.userAgent.match(/IEMobile/i);
//     },
//     any: function () {
//         return (
//             isMobile.Android() ||
//             isMobile.BlackBerry() ||
//             isMobile.IOS() ||
//             isMobile.Opera() ||
//             isMobile.Windows()
//         );
//     }
// };

// if (isMobile.any()) {
//     document.body.classList.add('touch');
//     const arrows = document.querySelectorAll('.menu__arrow');
//     if (arrows.length > 0) {
//         for (let index = 0; index < arrows.length; index++) {
//             const arrow = arrows[index];
//             arrow.addEventListener("click", function (e) {
//                 arrow.parentElement.classList.toggle('active');
//             });
//         }
//     }
// }

// else {
//     document.body.classList.add('pc');
// }

// // ПРОКРУТКА К ЭЛЕМЕНТУ
// const menuLinks = document.querySelectorAll('.menu__link[data-goto]');

// if (menuLinks.length > 0) {
//     menuLinks.forEach(menuLink => {
//         menuLink.addEventListener("click", onMenuLinkClick);
//     });

//     function onMenuLinkClick (e) {
//         const menuLink = e.target;
//         if (menuLink.dataset.goto && document.querySelector(menuLink.dataset.goto)) {
//             const gotoBlock = document.querySelector(menuLink.dataset.goto);
//             const gotoBlockValue = gotoBlock.getBoundingClientRect().top + pageYOffset - document.querySelector('header').offsetHeight;
//             if (menuIcon.classList.contains('active')) {
//                 menuIcon.classList.remove('active');
//                 menuBody.classList.remove('active');
//                 document.body.classList.remove('lock');
//             }
//             window.scrollTo({
//                 top: gotoBlockValue,
//                 behavior: "smooth"
//             });
//             e.preventDefault();
//         }
//     }
// }

// const menuIcon = document.querySelector('.menu__icon');
// const menuBody = document.querySelector('.menu__body');

// menuIcon.addEventListener("click", function (e) {
//     menuIcon.classList.toggle('active');
//     menuBody.classList.toggle('active');
//     document.body.classList.toggle('lock');
// });

// // ПОЛНОЄКРАННІЙ СКРОЛЛ
// let wrapper = document.querySelector('.wrapper');

// let pageSlider = new Swiper('.page', {
//     wrapperClass: "page__wrapper",
//     slideClass: "page__screen",
//     direction: 'vertical',
//     slidesPerView: 'auto',
//     parallax: true,
//     keyboard: {
//         enabled: true,
//         onlyInViewport: true,
//         pageUpDown: true,
//     },
//     mousewheel: {
//         sensivity: 1,
//     },
//     watchOverflow: true,
//     speed: 800,
//     observer: true,
//     observerParents: true,
//     observerSliderChildren: true,

//     pagination: {
//         el: '.page__pagination',
//         type: 'bullets',
//         clickable: true,
//         bulletClass: "page__bullet",
//         bulletActiveClass: "page__bullet_active",
//     },

//     scrollbar: {
//         el: '.page__scroll',
//         dragClass: "page__drag-scroll",
//         draggable: true,
//     },

//     init: false,
//     on: {
//         init: function() {
//             menuSlider();
//             setScrollType();
//             wrapper.classList.add('loaded');
//         },

//         slideChange: function() {
//             menuSliderRemove();
//             menuLinks[pageSlider.realIndex].classList.add('active');
//         },
//         resize: function() {
//             setScrollType();
//         },
//     },
// });

// const menuLinks = document.querySelectorAll('.menu__link');

// function menuSlider() {
//     if (menuLinks.length > 0) {
//         menuLinks[pageSlider.realIndex].classList.add('active');
//         for (let index = 0; index < menuLinks.length; index++) {
//             const menuLink = menuLinks[index];
//             menuLink.addEventListener("click", function(e) {
//                 menuSliderRemove()
//                 pageSlider.slideTo(index, 800); 
//                 menuLink.classList.add('active');
//                 e.preventDefault();
//             })
//         }
//     }
// }

// function menuSliderRemove() {
//     let menuLinkActive = document.querySelector('.menu__link.active');
//     if (menuLinkActive) {
//         menuLinkActive.classList.remove('active');
//     }
// }

// function setScrollType() {
//     if (wrapper.classList.contains('free')) {
//         wrapper.classList.remove('free');
//         pageSlider.params.freeMode.enabled = false;
//     }
//     for (let index = 0; index < pageSlider.slides.length; index++) {
//         let pageSlide = pageSlider.slides[index];
//         let pageSlideContent = pageSlide.querySelector('.screen__content');
//         if (pageSlideContent) {
//             const pageSlideContentHeight = pageSlideContent.offsetHeight;
//             if (pageSlideContentHeight > window.innerHeight) {
//                 wrapper.classList.add('free');
//                 pageSlider.params.freeMode.enabled = true;
//                 break;
//             }
//         }
//     }
// }

// pageSlider.init();

// // АНИМАЦИЯ ПРИ СКРОЛЛЕ
// let animItems = document.querySelectorAll('.anim__items');

// if (animItems.length > 0) {
//     window.addEventListener('scroll', animOnScroll);
//     function animOnScroll() {
//         for (let index = 0; index < animItems.length; index++) {
//             let animItem = animItems[index];
//             let animItemHeight = animItem.offsetHeight;
//             let animItemOffset = offset(animItem).top;
//             let animStart = 4;

//             let animItemPoint = window.innerHeight - animItemHeight / animStart;

//             if (animItemHeight > window.innerHeight) {
//                 let animItemPoint = window.innerHeight - window.innerHeight / animStart;
//             }

//             if ((pageYOffset > animItemOffset - animItemPoint) && pageYOffset < (animItemOffset + animItemHeight)) {
//                 animItem.classList.add('active');
//             }
//             else {
//                 if(!animItem.classList.contains('anim-no-hide')) {
//                     animItem.classList.remove('active');
//                 }
//             }
//         }
//     }
//     function offset(el) {
//         const rect = el.getBoundingClientRect(),
//             scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
//             scrollTop = window.pageYOffset || document.documentElement.scrollTop;
//         return { top: rect.top + scrollTop, left: rect.left + scrollLeft }
//     }

//     setTimeout(() => {
//         animOnScroll();
//     }, 300);
// }

// // ПЕРЕМЕЩЕНИЕ ЭЛЕМЕНТА И ВОВЗРАТ ПРИ ОПРЕДЕЛЕННОЙ ШИРИНЕ
// const region = document.querySelector('.actions-header__region');
// const regionParent = document.querySelector('.header__actions');
// const regionMoveParent = document.querySelector('.menu__body');

// window.addEventListener('resize', function(e) {
//     const viewportWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
//     if (viewportWidth < 767.98) {
//         if(!region.classList.contains('done')) {
//             regionMoveParent.insertBefore(region, regionMoveParent.children[1]);
//             region.classList.add('done');
//         }
//     }
//     else {
//         if(region.classList.contains('done')) {
//             regionParent.insertBefore(region, regionParent.children[0]);
//             region.classList.remove('done');
//         }
//     }
// })

// ОПРЕДЕЛЕНИЕ ТИПА УСТРОЙСТВА
var isMobile = {
  Android: function Android() {
    return navigator.userAgent.match(/Android/i);
  },
  BlackBerry: function BlackBerry() {
    return navigator.userAgent.match(/BlackBerry/i);
  },
  IOS: function IOS() {
    return navigator.userAgent.match(/iPhone|iPad|iPod/i);
  },
  Opera: function Opera() {
    return navigator.userAgent.match(/Opera Mini/i);
  },
  Windows: function Windows() {
    return navigator.userAgent.match(/IEMobile/i);
  },
  any: function any() {
    return isMobile.Android() || isMobile.BlackBerry() || isMobile.IOS() || isMobile.Opera() || isMobile.Windows();
  }
};

// МЕНЮ БУРГЕР
var iconMenu = document.querySelector('.icon-menu');
var menuHeader = document.querySelector('.menu__body');
if (iconMenu) {
  iconMenu.addEventListener("click", function (event) {
    document.body.classList.toggle('lock');
    iconMenu.classList.toggle('active');
    menuHeader.classList.toggle('active');
  });
}

// ПЕРЕМЕЩЕНИЕ ЭЛЕМЕНТОВ ШАПКИ И ВОВЗРАТ ПРИ ОПРЕДЕЛЕННОЙ ШИРИНЕ
var actions = document.querySelector('.actions-header');
var info = document.querySelector('.info-header__column_callback');
var cart = document.querySelector('.info-header__cart');
var actionsParent = document.querySelector('.bottom-header__column_actions');
var infoParent = document.querySelector('.info-header');
var cartParent = document.querySelector('.info-header__column_cart');
var actionsAndInfoMoveParent = document.querySelector('.menu__body');
var cartMoveParent = document.querySelector('.contacts-header__column_forcart');
window.addEventListener('resize', function (e) {
  var viewportWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
  if (viewportWidth < 640) {
    if (!actions.classList.contains('done') && !info.classList.contains('done') && !cart.classList.contains('done')) {
      actionsAndInfoMoveParent.append(actions);
      actions.classList.add('done');
      actionsAndInfoMoveParent.append(info);
      info.classList.add('done');
      cartMoveParent.append(cart);
      cart.classList.add('done');
    }
  } else {
    if (actions.classList.contains('done') && info.classList.contains('done') && cart.classList.contains('done')) {
      actionsParent.prepend(actions);
      actions.classList.remove('done');
      infoParent.prepend(info);
      info.classList.remove('done');
      cartParent.append(cart);
      cart.classList.remove('done');
    }
  }
});

// ОТКРЫТИЕ ПОДМЕНЮ У КАТАЛОГА ТОВАРОВ
if (isMobile.any()) {
  var menuParents = document.querySelectorAll('.menu-page__parent > a');
  if (menuParents.length > 0) {
    var _loop = function _loop() {
      var menuParent = menuParents[index];
      menuParent.addEventListener("click", function (e) {
        menuParent.parentElement.classList.toggle('active');
        e.preventDefault();
      });
    };
    for (var index = 0; index < menuParents.length; index++) {
      _loop();
    }
  }
} else {
  var _menuParents = document.querySelectorAll('.menu-page__parent');
  if (_menuParents.length > 0) {
    var _loop2 = function _loop2() {
      var menuParent = _menuParents[_index];
      menuParent.addEventListener("mouseenter", function (e) {
        menuParent.classList.add('active');
      });
      menuParent.addEventListener("mouseleave", function (e) {
        menuParent.classList.remove('active');
      });
    };
    for (var _index = 0; _index < _menuParents.length; _index++) {
      _loop2();
    }
  }
}

// БУРГЕР БОКОВОЙ ПАНЕЛИ
var menuPageBurger = document.querySelector('.menu-page__burger');
var menuPageBody = document.querySelector('.menu-page__body');
menuPageBurger.addEventListener("click", function (e) {
  menuPageBurger.classList.toggle('active');
});
$(document).ready(function () {
  $(menuPageBurger).click(function (event) {
    $(menuPageBody).slideToggle(300);
  });
});

// ВЫПАДЮЩЕЕ МЕНЮ ФОРМЫ
var searchSelect = document.querySelector('.search-page__title');
var categoriesSearch = document.querySelector('.categories-search');
searchSelect.addEventListener("click", function (e) {
  searchSelect.classList.toggle('active');
});
$(document).ready(function () {
  $(searchSelect).click(function (event) {
    $(categoriesSearch).slideToggle(300);
  });
});

// ИЗМЕНЕНИЕ СЛОВ В ФОРМЕ
var checkboxCategories = document.querySelectorAll('.categories-search__checkbox');
if (checkboxCategories.length > 0) {
  var _loop3 = function _loop3() {
    var checkboxCategory = checkboxCategories[_index2];
    checkboxCategory.addEventListener("change", function (e) {
      checkboxCategory.classList.toggle('active');
      var checkboxActiveCategories = document.querySelectorAll('.categories-search__checkbox.active');
      if (checkboxActiveCategories.length > 0) {
        searchSelect.classList.add('categories');
        var searchQuantity = searchSelect.querySelector('.search-page__quantity');
        searchQuantity.innerHTML = searchQuantity.getAttribute('data-text') + ' ' + checkboxActiveCategories.length;
      } else {
        searchSelect.classList.remove('categories');
      }
    });
  };
  for (var _index2 = 0; _index2 < checkboxCategories.length; _index2++) {
    _loop3();
  }
}

// ПЕРЕМЕЩЕНИЕ НОВОСТЕЙ И ОТЗЫВОВ И ВОВЗРАТ ПРИ ОПРЕДЕЛЕННОЙ ШИРИНЕ
var contentSide = document.querySelector('.page__content-side');
var contentSideParent = document.querySelector('.page__side');
var contentSideMoveParent = document.querySelector('.page__content');
window.addEventListener('resize', function (e) {
  var viewportWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
  if (viewportWidth < 992) {
    if (!contentSide.classList.contains('done')) {
      contentSideMoveParent.append(contentSide);
      contentSide.classList.add('done');
    }
  } else {
    if (contentSide.classList.contains('done')) {
      contentSideParent.append(contentSide);
      contentSide.classList.remove('done');
    }
  }
});

// NOIU СЛАЙДЕР
var priceSlider = document.querySelector('.price-filter__slider');
if (priceSlider) {
  noUiSlider.create(priceSlider, {
    start: [0, 200000],
    connect: true,
    tooltips: [wNumb({
      decimals: 0
    }), wNumb({
      decimals: 0
    })],
    range: {
      'min': [0],
      'max': [200000]
    }
  });
  var priceStart = document.getElementById('price-start');
  var priceEnd = document.getElementById('price-end');
  priceStart.addEventListener("change", function (e) {
    priceSlider.noUiSlider.setHandle(0, priceStart.value, true, true);
  });
  priceEnd.addEventListener("change", function (e) {
    priceSlider.noUiSlider.setHandle(1, priceEnd.value, true, true);
  });
}

// СПОЙЛЕРЫ
var spollersHeader = document.querySelectorAll('.section-filter__title.spoller');
if (spollersHeader.length > 0) {
  var _loop4 = function _loop4() {
    var spollerHeader = spollersHeader[_index3];
    var spollerBody = spollerHeader.nextElementSibling;
    spollerHeader.addEventListener("click", function (e) {
      spollerHeader.classList.toggle('active');
      //spollerBody.classList.toggle('active');
    });
  };
  for (var _index3 = 0; _index3 < spollersHeader.length; _index3++) {
    _loop4();
  }
}
$(document).ready(function () {
  $(spollersHeader).click(function (event) {
    $(this).next().slideToggle(300);
  });
});

// ДОБАВЛЕНИЕ CHECKED ВЫБРАННЫМ ЭЛЕМЕНТАМ CHEKBOX
var filtersCheckbox = document.querySelectorAll('.section-filter__checkbox');
if (filtersCheckbox.length > 0) {
  var _loop5 = function _loop5() {
    var filterCheckbox = filtersCheckbox[_index4];
    filterCheckbox.addEventListener("change", function (e) {
      filterCheckbox.firstElementChild.toggleAttribute('checked');
    });
  };
  for (var _index4 = 0; _index4 < filtersCheckbox.length; _index4++) {
    _loop5();
  }
}

// ОТКРЫТИЕ ФИЛЬТРА ТОВАРОВ
if (isMobile.any()) {
  var filterTitle = document.querySelector('.filter__title');
  $(document).ready(function () {
    $(filterTitle).click(function (event) {
      $(this).next().slideToggle(300);
    });
  });
}
!function (i) {
  "use strict";

  "function" == typeof define && define.amd ? define(["jquery"], i) : "undefined" != typeof exports ? module.exports = i(require("jquery")) : i(jQuery);
}(function (i) {
  "use strict";

  var e = window.Slick || {};
  (e = function () {
    var e = 0;
    return function (t, o) {
      var s,
        n = this;
      n.defaults = {
        accessibility: !0,
        adaptiveHeight: !1,
        appendArrows: i(t),
        appendDots: i(t),
        arrows: !0,
        asNavFor: null,
        prevArrow: '<button class="slick-prev" aria-label="Previous" type="button">Previous</button>',
        nextArrow: '<button class="slick-next" aria-label="Next" type="button">Next</button>',
        autoplay: !1,
        autoplaySpeed: 3e3,
        centerMode: !1,
        centerPadding: "50px",
        cssEase: "ease",
        customPaging: function customPaging(e, t) {
          return i('<button type="button" />').text(t + 1);
        },
        dots: !1,
        dotsClass: "slick-dots",
        draggable: !0,
        easing: "linear",
        edgeFriction: .35,
        fade: !1,
        focusOnSelect: !1,
        focusOnChange: !1,
        infinite: !0,
        initialSlide: 0,
        lazyLoad: "ondemand",
        mobileFirst: !1,
        pauseOnHover: !0,
        pauseOnFocus: !0,
        pauseOnDotsHover: !1,
        respondTo: "window",
        responsive: null,
        rows: 1,
        rtl: !1,
        slide: "",
        slidesPerRow: 1,
        slidesToShow: 1,
        slidesToScroll: 1,
        speed: 500,
        swipe: !0,
        swipeToSlide: !1,
        touchMove: !0,
        touchThreshold: 5,
        useCSS: !0,
        useTransform: !0,
        variableWidth: !1,
        vertical: !1,
        verticalSwiping: !1,
        waitForAnimate: !0,
        zIndex: 1e3
      }, n.initials = {
        animating: !1,
        dragging: !1,
        autoPlayTimer: null,
        currentDirection: 0,
        currentLeft: null,
        currentSlide: 0,
        direction: 1,
        $dots: null,
        listWidth: null,
        listHeight: null,
        loadIndex: 0,
        $nextArrow: null,
        $prevArrow: null,
        scrolling: !1,
        slideCount: null,
        slideWidth: null,
        $slideTrack: null,
        $slides: null,
        sliding: !1,
        slideOffset: 0,
        swipeLeft: null,
        swiping: !1,
        $list: null,
        touchObject: {},
        transformsEnabled: !1,
        unslicked: !1
      }, i.extend(n, n.initials), n.activeBreakpoint = null, n.animType = null, n.animProp = null, n.breakpoints = [], n.breakpointSettings = [], n.cssTransitions = !1, n.focussed = !1, n.interrupted = !1, n.hidden = "hidden", n.paused = !0, n.positionProp = null, n.respondTo = null, n.rowCount = 1, n.shouldClick = !0, n.$slider = i(t), n.$slidesCache = null, n.transformType = null, n.transitionType = null, n.visibilityChange = "visibilitychange", n.windowWidth = 0, n.windowTimer = null, s = i(t).data("slick") || {}, n.options = i.extend({}, n.defaults, o, s), n.currentSlide = n.options.initialSlide, n.originalSettings = n.options, void 0 !== document.mozHidden ? (n.hidden = "mozHidden", n.visibilityChange = "mozvisibilitychange") : void 0 !== document.webkitHidden && (n.hidden = "webkitHidden", n.visibilityChange = "webkitvisibilitychange"), n.autoPlay = i.proxy(n.autoPlay, n), n.autoPlayClear = i.proxy(n.autoPlayClear, n), n.autoPlayIterator = i.proxy(n.autoPlayIterator, n), n.changeSlide = i.proxy(n.changeSlide, n), n.clickHandler = i.proxy(n.clickHandler, n), n.selectHandler = i.proxy(n.selectHandler, n), n.setPosition = i.proxy(n.setPosition, n), n.swipeHandler = i.proxy(n.swipeHandler, n), n.dragHandler = i.proxy(n.dragHandler, n), n.keyHandler = i.proxy(n.keyHandler, n), n.instanceUid = e++, n.htmlExpr = /^(?:\s*(<[\w\W]+>)[^>]*)$/, n.registerBreakpoints(), n.init(!0);
    };
  }()).prototype.activateADA = function () {
    this.$slideTrack.find(".slick-active").attr({
      "aria-hidden": "false"
    }).find("a, input, button, select").attr({
      tabindex: "0"
    });
  }, e.prototype.addSlide = e.prototype.slickAdd = function (e, t, o) {
    var s = this;
    if ("boolean" == typeof t) o = t, t = null;else if (t < 0 || t >= s.slideCount) return !1;
    s.unload(), "number" == typeof t ? 0 === t && 0 === s.$slides.length ? i(e).appendTo(s.$slideTrack) : o ? i(e).insertBefore(s.$slides.eq(t)) : i(e).insertAfter(s.$slides.eq(t)) : !0 === o ? i(e).prependTo(s.$slideTrack) : i(e).appendTo(s.$slideTrack), s.$slides = s.$slideTrack.children(this.options.slide), s.$slideTrack.children(this.options.slide).detach(), s.$slideTrack.append(s.$slides), s.$slides.each(function (e, t) {
      i(t).attr("data-slick-index", e);
    }), s.$slidesCache = s.$slides, s.reinit();
  }, e.prototype.animateHeight = function () {
    var i = this;
    if (1 === i.options.slidesToShow && !0 === i.options.adaptiveHeight && !1 === i.options.vertical) {
      var e = i.$slides.eq(i.currentSlide).outerHeight(!0);
      i.$list.animate({
        height: e
      }, i.options.speed);
    }
  }, e.prototype.animateSlide = function (e, t) {
    var o = {},
      s = this;
    s.animateHeight(), !0 === s.options.rtl && !1 === s.options.vertical && (e = -e), !1 === s.transformsEnabled ? !1 === s.options.vertical ? s.$slideTrack.animate({
      left: e
    }, s.options.speed, s.options.easing, t) : s.$slideTrack.animate({
      top: e
    }, s.options.speed, s.options.easing, t) : !1 === s.cssTransitions ? (!0 === s.options.rtl && (s.currentLeft = -s.currentLeft), i({
      animStart: s.currentLeft
    }).animate({
      animStart: e
    }, {
      duration: s.options.speed,
      easing: s.options.easing,
      step: function step(i) {
        i = Math.ceil(i), !1 === s.options.vertical ? (o[s.animType] = "translate(" + i + "px, 0px)", s.$slideTrack.css(o)) : (o[s.animType] = "translate(0px," + i + "px)", s.$slideTrack.css(o));
      },
      complete: function complete() {
        t && t.call();
      }
    })) : (s.applyTransition(), e = Math.ceil(e), !1 === s.options.vertical ? o[s.animType] = "translate3d(" + e + "px, 0px, 0px)" : o[s.animType] = "translate3d(0px," + e + "px, 0px)", s.$slideTrack.css(o), t && setTimeout(function () {
      s.disableTransition(), t.call();
    }, s.options.speed));
  }, e.prototype.getNavTarget = function () {
    var e = this,
      t = e.options.asNavFor;
    return t && null !== t && (t = i(t).not(e.$slider)), t;
  }, e.prototype.asNavFor = function (e) {
    var t = this.getNavTarget();
    null !== t && "object" == _typeof(t) && t.each(function () {
      var t = i(this).slick("getSlick");
      t.unslicked || t.slideHandler(e, !0);
    });
  }, e.prototype.applyTransition = function (i) {
    var e = this,
      t = {};
    !1 === e.options.fade ? t[e.transitionType] = e.transformType + " " + e.options.speed + "ms " + e.options.cssEase : t[e.transitionType] = "opacity " + e.options.speed + "ms " + e.options.cssEase, !1 === e.options.fade ? e.$slideTrack.css(t) : e.$slides.eq(i).css(t);
  }, e.prototype.autoPlay = function () {
    var i = this;
    i.autoPlayClear(), i.slideCount > i.options.slidesToShow && (i.autoPlayTimer = setInterval(i.autoPlayIterator, i.options.autoplaySpeed));
  }, e.prototype.autoPlayClear = function () {
    var i = this;
    i.autoPlayTimer && clearInterval(i.autoPlayTimer);
  }, e.prototype.autoPlayIterator = function () {
    var i = this,
      e = i.currentSlide + i.options.slidesToScroll;
    i.paused || i.interrupted || i.focussed || (!1 === i.options.infinite && (1 === i.direction && i.currentSlide + 1 === i.slideCount - 1 ? i.direction = 0 : 0 === i.direction && (e = i.currentSlide - i.options.slidesToScroll, i.currentSlide - 1 == 0 && (i.direction = 1))), i.slideHandler(e));
  }, e.prototype.buildArrows = function () {
    var e = this;
    !0 === e.options.arrows && (e.$prevArrow = i(e.options.prevArrow).addClass("slick-arrow"), e.$nextArrow = i(e.options.nextArrow).addClass("slick-arrow"), e.slideCount > e.options.slidesToShow ? (e.$prevArrow.removeClass("slick-hidden").removeAttr("aria-hidden tabindex"), e.$nextArrow.removeClass("slick-hidden").removeAttr("aria-hidden tabindex"), e.htmlExpr.test(e.options.prevArrow) && e.$prevArrow.prependTo(e.options.appendArrows), e.htmlExpr.test(e.options.nextArrow) && e.$nextArrow.appendTo(e.options.appendArrows), !0 !== e.options.infinite && e.$prevArrow.addClass("slick-disabled").attr("aria-disabled", "true")) : e.$prevArrow.add(e.$nextArrow).addClass("slick-hidden").attr({
      "aria-disabled": "true",
      tabindex: "-1"
    }));
  }, e.prototype.buildDots = function () {
    var e,
      t,
      o = this;
    if (!0 === o.options.dots) {
      for (o.$slider.addClass("slick-dotted"), t = i("<ul />").addClass(o.options.dotsClass), e = 0; e <= o.getDotCount(); e += 1) t.append(i("<li />").append(o.options.customPaging.call(this, o, e)));
      o.$dots = t.appendTo(o.options.appendDots), o.$dots.find("li").first().addClass("slick-active");
    }
  }, e.prototype.buildOut = function () {
    var e = this;
    e.$slides = e.$slider.children(e.options.slide + ":not(.slick-cloned)").addClass("slick-slide"), e.slideCount = e.$slides.length, e.$slides.each(function (e, t) {
      i(t).attr("data-slick-index", e).data("originalStyling", i(t).attr("style") || "");
    }), e.$slider.addClass("slick-slider"), e.$slideTrack = 0 === e.slideCount ? i('<div class="slick-track"/>').appendTo(e.$slider) : e.$slides.wrapAll('<div class="slick-track"/>').parent(), e.$list = e.$slideTrack.wrap('<div class="slick-list"/>').parent(), e.$slideTrack.css("opacity", 0), !0 !== e.options.centerMode && !0 !== e.options.swipeToSlide || (e.options.slidesToScroll = 1), i("img[data-lazy]", e.$slider).not("[src]").addClass("slick-loading"), e.setupInfinite(), e.buildArrows(), e.buildDots(), e.updateDots(), e.setSlideClasses("number" == typeof e.currentSlide ? e.currentSlide : 0), !0 === e.options.draggable && e.$list.addClass("draggable");
  }, e.prototype.buildRows = function () {
    var i,
      e,
      t,
      o,
      s,
      n,
      r,
      l = this;
    if (o = document.createDocumentFragment(), n = l.$slider.children(), l.options.rows > 1) {
      for (r = l.options.slidesPerRow * l.options.rows, s = Math.ceil(n.length / r), i = 0; i < s; i++) {
        var d = document.createElement("div");
        for (e = 0; e < l.options.rows; e++) {
          var a = document.createElement("div");
          for (t = 0; t < l.options.slidesPerRow; t++) {
            var c = i * r + (e * l.options.slidesPerRow + t);
            n.get(c) && a.appendChild(n.get(c));
          }
          d.appendChild(a);
        }
        o.appendChild(d);
      }
      l.$slider.empty().append(o), l.$slider.children().children().children().css({
        width: 100 / l.options.slidesPerRow + "%",
        display: "inline-block"
      });
    }
  }, e.prototype.checkResponsive = function (e, t) {
    var o,
      s,
      n,
      r = this,
      l = !1,
      d = r.$slider.width(),
      a = window.innerWidth || i(window).width();
    if ("window" === r.respondTo ? n = a : "slider" === r.respondTo ? n = d : "min" === r.respondTo && (n = Math.min(a, d)), r.options.responsive && r.options.responsive.length && null !== r.options.responsive) {
      s = null;
      for (o in r.breakpoints) r.breakpoints.hasOwnProperty(o) && (!1 === r.originalSettings.mobileFirst ? n < r.breakpoints[o] && (s = r.breakpoints[o]) : n > r.breakpoints[o] && (s = r.breakpoints[o]));
      null !== s ? null !== r.activeBreakpoint ? (s !== r.activeBreakpoint || t) && (r.activeBreakpoint = s, "unslick" === r.breakpointSettings[s] ? r.unslick(s) : (r.options = i.extend({}, r.originalSettings, r.breakpointSettings[s]), !0 === e && (r.currentSlide = r.options.initialSlide), r.refresh(e)), l = s) : (r.activeBreakpoint = s, "unslick" === r.breakpointSettings[s] ? r.unslick(s) : (r.options = i.extend({}, r.originalSettings, r.breakpointSettings[s]), !0 === e && (r.currentSlide = r.options.initialSlide), r.refresh(e)), l = s) : null !== r.activeBreakpoint && (r.activeBreakpoint = null, r.options = r.originalSettings, !0 === e && (r.currentSlide = r.options.initialSlide), r.refresh(e), l = s), e || !1 === l || r.$slider.trigger("breakpoint", [r, l]);
    }
  }, e.prototype.changeSlide = function (e, t) {
    var o,
      s,
      n,
      r = this,
      l = i(e.currentTarget);
    switch (l.is("a") && e.preventDefault(), l.is("li") || (l = l.closest("li")), n = r.slideCount % r.options.slidesToScroll != 0, o = n ? 0 : (r.slideCount - r.currentSlide) % r.options.slidesToScroll, e.data.message) {
      case "previous":
        s = 0 === o ? r.options.slidesToScroll : r.options.slidesToShow - o, r.slideCount > r.options.slidesToShow && r.slideHandler(r.currentSlide - s, !1, t);
        break;
      case "next":
        s = 0 === o ? r.options.slidesToScroll : o, r.slideCount > r.options.slidesToShow && r.slideHandler(r.currentSlide + s, !1, t);
        break;
      case "index":
        var d = 0 === e.data.index ? 0 : e.data.index || l.index() * r.options.slidesToScroll;
        r.slideHandler(r.checkNavigable(d), !1, t), l.children().trigger("focus");
        break;
      default:
        return;
    }
  }, e.prototype.checkNavigable = function (i) {
    var e, t;
    if (e = this.getNavigableIndexes(), t = 0, i > e[e.length - 1]) i = e[e.length - 1];else for (var o in e) {
      if (i < e[o]) {
        i = t;
        break;
      }
      t = e[o];
    }
    return i;
  }, e.prototype.cleanUpEvents = function () {
    var e = this;
    e.options.dots && null !== e.$dots && (i("li", e.$dots).off("click.slick", e.changeSlide).off("mouseenter.slick", i.proxy(e.interrupt, e, !0)).off("mouseleave.slick", i.proxy(e.interrupt, e, !1)), !0 === e.options.accessibility && e.$dots.off("keydown.slick", e.keyHandler)), e.$slider.off("focus.slick blur.slick"), !0 === e.options.arrows && e.slideCount > e.options.slidesToShow && (e.$prevArrow && e.$prevArrow.off("click.slick", e.changeSlide), e.$nextArrow && e.$nextArrow.off("click.slick", e.changeSlide), !0 === e.options.accessibility && (e.$prevArrow && e.$prevArrow.off("keydown.slick", e.keyHandler), e.$nextArrow && e.$nextArrow.off("keydown.slick", e.keyHandler))), e.$list.off("touchstart.slick mousedown.slick", e.swipeHandler), e.$list.off("touchmove.slick mousemove.slick", e.swipeHandler), e.$list.off("touchend.slick mouseup.slick", e.swipeHandler), e.$list.off("touchcancel.slick mouseleave.slick", e.swipeHandler), e.$list.off("click.slick", e.clickHandler), i(document).off(e.visibilityChange, e.visibility), e.cleanUpSlideEvents(), !0 === e.options.accessibility && e.$list.off("keydown.slick", e.keyHandler), !0 === e.options.focusOnSelect && i(e.$slideTrack).children().off("click.slick", e.selectHandler), i(window).off("orientationchange.slick.slick-" + e.instanceUid, e.orientationChange), i(window).off("resize.slick.slick-" + e.instanceUid, e.resize), i("[draggable!=true]", e.$slideTrack).off("dragstart", e.preventDefault), i(window).off("load.slick.slick-" + e.instanceUid, e.setPosition);
  }, e.prototype.cleanUpSlideEvents = function () {
    var e = this;
    e.$list.off("mouseenter.slick", i.proxy(e.interrupt, e, !0)), e.$list.off("mouseleave.slick", i.proxy(e.interrupt, e, !1));
  }, e.prototype.cleanUpRows = function () {
    var i,
      e = this;
    e.options.rows > 1 && ((i = e.$slides.children().children()).removeAttr("style"), e.$slider.empty().append(i));
  }, e.prototype.clickHandler = function (i) {
    !1 === this.shouldClick && (i.stopImmediatePropagation(), i.stopPropagation(), i.preventDefault());
  }, e.prototype.destroy = function (e) {
    var t = this;
    t.autoPlayClear(), t.touchObject = {}, t.cleanUpEvents(), i(".slick-cloned", t.$slider).detach(), t.$dots && t.$dots.remove(), t.$prevArrow && t.$prevArrow.length && (t.$prevArrow.removeClass("slick-disabled slick-arrow slick-hidden").removeAttr("aria-hidden aria-disabled tabindex").css("display", ""), t.htmlExpr.test(t.options.prevArrow) && t.$prevArrow.remove()), t.$nextArrow && t.$nextArrow.length && (t.$nextArrow.removeClass("slick-disabled slick-arrow slick-hidden").removeAttr("aria-hidden aria-disabled tabindex").css("display", ""), t.htmlExpr.test(t.options.nextArrow) && t.$nextArrow.remove()), t.$slides && (t.$slides.removeClass("slick-slide slick-active slick-center slick-visible slick-current").removeAttr("aria-hidden").removeAttr("data-slick-index").each(function () {
      i(this).attr("style", i(this).data("originalStyling"));
    }), t.$slideTrack.children(this.options.slide).detach(), t.$slideTrack.detach(), t.$list.detach(), t.$slider.append(t.$slides)), t.cleanUpRows(), t.$slider.removeClass("slick-slider"), t.$slider.removeClass("slick-initialized"), t.$slider.removeClass("slick-dotted"), t.unslicked = !0, e || t.$slider.trigger("destroy", [t]);
  }, e.prototype.disableTransition = function (i) {
    var e = this,
      t = {};
    t[e.transitionType] = "", !1 === e.options.fade ? e.$slideTrack.css(t) : e.$slides.eq(i).css(t);
  }, e.prototype.fadeSlide = function (i, e) {
    var t = this;
    !1 === t.cssTransitions ? (t.$slides.eq(i).css({
      zIndex: t.options.zIndex
    }), t.$slides.eq(i).animate({
      opacity: 1
    }, t.options.speed, t.options.easing, e)) : (t.applyTransition(i), t.$slides.eq(i).css({
      opacity: 1,
      zIndex: t.options.zIndex
    }), e && setTimeout(function () {
      t.disableTransition(i), e.call();
    }, t.options.speed));
  }, e.prototype.fadeSlideOut = function (i) {
    var e = this;
    !1 === e.cssTransitions ? e.$slides.eq(i).animate({
      opacity: 0,
      zIndex: e.options.zIndex - 2
    }, e.options.speed, e.options.easing) : (e.applyTransition(i), e.$slides.eq(i).css({
      opacity: 0,
      zIndex: e.options.zIndex - 2
    }));
  }, e.prototype.filterSlides = e.prototype.slickFilter = function (i) {
    var e = this;
    null !== i && (e.$slidesCache = e.$slides, e.unload(), e.$slideTrack.children(this.options.slide).detach(), e.$slidesCache.filter(i).appendTo(e.$slideTrack), e.reinit());
  }, e.prototype.focusHandler = function () {
    var e = this;
    e.$slider.off("focus.slick blur.slick").on("focus.slick blur.slick", "*", function (t) {
      t.stopImmediatePropagation();
      var o = i(this);
      setTimeout(function () {
        e.options.pauseOnFocus && (e.focussed = o.is(":focus"), e.autoPlay());
      }, 0);
    });
  }, e.prototype.getCurrent = e.prototype.slickCurrentSlide = function () {
    return this.currentSlide;
  }, e.prototype.getDotCount = function () {
    var i = this,
      e = 0,
      t = 0,
      o = 0;
    if (!0 === i.options.infinite) {
      if (i.slideCount <= i.options.slidesToShow) ++o;else for (; e < i.slideCount;) ++o, e = t + i.options.slidesToScroll, t += i.options.slidesToScroll <= i.options.slidesToShow ? i.options.slidesToScroll : i.options.slidesToShow;
    } else if (!0 === i.options.centerMode) o = i.slideCount;else if (i.options.asNavFor) for (; e < i.slideCount;) ++o, e = t + i.options.slidesToScroll, t += i.options.slidesToScroll <= i.options.slidesToShow ? i.options.slidesToScroll : i.options.slidesToShow;else o = 1 + Math.ceil((i.slideCount - i.options.slidesToShow) / i.options.slidesToScroll);
    return o - 1;
  }, e.prototype.getLeft = function (i) {
    var e,
      t,
      o,
      s,
      n = this,
      r = 0;
    return n.slideOffset = 0, t = n.$slides.first().outerHeight(!0), !0 === n.options.infinite ? (n.slideCount > n.options.slidesToShow && (n.slideOffset = n.slideWidth * n.options.slidesToShow * -1, s = -1, !0 === n.options.vertical && !0 === n.options.centerMode && (2 === n.options.slidesToShow ? s = -1.5 : 1 === n.options.slidesToShow && (s = -2)), r = t * n.options.slidesToShow * s), n.slideCount % n.options.slidesToScroll != 0 && i + n.options.slidesToScroll > n.slideCount && n.slideCount > n.options.slidesToShow && (i > n.slideCount ? (n.slideOffset = (n.options.slidesToShow - (i - n.slideCount)) * n.slideWidth * -1, r = (n.options.slidesToShow - (i - n.slideCount)) * t * -1) : (n.slideOffset = n.slideCount % n.options.slidesToScroll * n.slideWidth * -1, r = n.slideCount % n.options.slidesToScroll * t * -1))) : i + n.options.slidesToShow > n.slideCount && (n.slideOffset = (i + n.options.slidesToShow - n.slideCount) * n.slideWidth, r = (i + n.options.slidesToShow - n.slideCount) * t), n.slideCount <= n.options.slidesToShow && (n.slideOffset = 0, r = 0), !0 === n.options.centerMode && n.slideCount <= n.options.slidesToShow ? n.slideOffset = n.slideWidth * Math.floor(n.options.slidesToShow) / 2 - n.slideWidth * n.slideCount / 2 : !0 === n.options.centerMode && !0 === n.options.infinite ? n.slideOffset += n.slideWidth * Math.floor(n.options.slidesToShow / 2) - n.slideWidth : !0 === n.options.centerMode && (n.slideOffset = 0, n.slideOffset += n.slideWidth * Math.floor(n.options.slidesToShow / 2)), e = !1 === n.options.vertical ? i * n.slideWidth * -1 + n.slideOffset : i * t * -1 + r, !0 === n.options.variableWidth && (o = n.slideCount <= n.options.slidesToShow || !1 === n.options.infinite ? n.$slideTrack.children(".slick-slide").eq(i) : n.$slideTrack.children(".slick-slide").eq(i + n.options.slidesToShow), e = !0 === n.options.rtl ? o[0] ? -1 * (n.$slideTrack.width() - o[0].offsetLeft - o.width()) : 0 : o[0] ? -1 * o[0].offsetLeft : 0, !0 === n.options.centerMode && (o = n.slideCount <= n.options.slidesToShow || !1 === n.options.infinite ? n.$slideTrack.children(".slick-slide").eq(i) : n.$slideTrack.children(".slick-slide").eq(i + n.options.slidesToShow + 1), e = !0 === n.options.rtl ? o[0] ? -1 * (n.$slideTrack.width() - o[0].offsetLeft - o.width()) : 0 : o[0] ? -1 * o[0].offsetLeft : 0, e += (n.$list.width() - o.outerWidth()) / 2)), e;
  }, e.prototype.getOption = e.prototype.slickGetOption = function (i) {
    return this.options[i];
  }, e.prototype.getNavigableIndexes = function () {
    var i,
      e = this,
      t = 0,
      o = 0,
      s = [];
    for (!1 === e.options.infinite ? i = e.slideCount : (t = -1 * e.options.slidesToScroll, o = -1 * e.options.slidesToScroll, i = 2 * e.slideCount); t < i;) s.push(t), t = o + e.options.slidesToScroll, o += e.options.slidesToScroll <= e.options.slidesToShow ? e.options.slidesToScroll : e.options.slidesToShow;
    return s;
  }, e.prototype.getSlick = function () {
    return this;
  }, e.prototype.getSlideCount = function () {
    var e,
      t,
      o = this;
    return t = !0 === o.options.centerMode ? o.slideWidth * Math.floor(o.options.slidesToShow / 2) : 0, !0 === o.options.swipeToSlide ? (o.$slideTrack.find(".slick-slide").each(function (s, n) {
      if (n.offsetLeft - t + i(n).outerWidth() / 2 > -1 * o.swipeLeft) return e = n, !1;
    }), Math.abs(i(e).attr("data-slick-index") - o.currentSlide) || 1) : o.options.slidesToScroll;
  }, e.prototype.goTo = e.prototype.slickGoTo = function (i, e) {
    this.changeSlide({
      data: {
        message: "index",
        index: parseInt(i)
      }
    }, e);
  }, e.prototype.init = function (e) {
    var t = this;
    i(t.$slider).hasClass("slick-initialized") || (i(t.$slider).addClass("slick-initialized"), t.buildRows(), t.buildOut(), t.setProps(), t.startLoad(), t.loadSlider(), t.initializeEvents(), t.updateArrows(), t.updateDots(), t.checkResponsive(!0), t.focusHandler()), e && t.$slider.trigger("init", [t]), !0 === t.options.accessibility && t.initADA(), t.options.autoplay && (t.paused = !1, t.autoPlay());
  }, e.prototype.initADA = function () {
    var e = this,
      t = Math.ceil(e.slideCount / e.options.slidesToShow),
      o = e.getNavigableIndexes().filter(function (i) {
        return i >= 0 && i < e.slideCount;
      });
    e.$slides.add(e.$slideTrack.find(".slick-cloned")).attr({
      "aria-hidden": "true",
      tabindex: "-1"
    }).find("a, input, button, select").attr({
      tabindex: "-1"
    }), null !== e.$dots && (e.$slides.not(e.$slideTrack.find(".slick-cloned")).each(function (t) {
      var s = o.indexOf(t);
      i(this).attr({
        role: "tabpanel",
        id: "slick-slide" + e.instanceUid + t,
        tabindex: -1
      }), -1 !== s && i(this).attr({
        "aria-describedby": "slick-slide-control" + e.instanceUid + s
      });
    }), e.$dots.attr("role", "tablist").find("li").each(function (s) {
      var n = o[s];
      i(this).attr({
        role: "presentation"
      }), i(this).find("button").first().attr({
        role: "tab",
        id: "slick-slide-control" + e.instanceUid + s,
        "aria-controls": "slick-slide" + e.instanceUid + n,
        "aria-label": s + 1 + " of " + t,
        "aria-selected": null,
        tabindex: "-1"
      });
    }).eq(e.currentSlide).find("button").attr({
      "aria-selected": "true",
      tabindex: "0"
    }).end());
    for (var s = e.currentSlide, n = s + e.options.slidesToShow; s < n; s++) e.$slides.eq(s).attr("tabindex", 0);
    e.activateADA();
  }, e.prototype.initArrowEvents = function () {
    var i = this;
    !0 === i.options.arrows && i.slideCount > i.options.slidesToShow && (i.$prevArrow.off("click.slick").on("click.slick", {
      message: "previous"
    }, i.changeSlide), i.$nextArrow.off("click.slick").on("click.slick", {
      message: "next"
    }, i.changeSlide), !0 === i.options.accessibility && (i.$prevArrow.on("keydown.slick", i.keyHandler), i.$nextArrow.on("keydown.slick", i.keyHandler)));
  }, e.prototype.initDotEvents = function () {
    var e = this;
    !0 === e.options.dots && (i("li", e.$dots).on("click.slick", {
      message: "index"
    }, e.changeSlide), !0 === e.options.accessibility && e.$dots.on("keydown.slick", e.keyHandler)), !0 === e.options.dots && !0 === e.options.pauseOnDotsHover && i("li", e.$dots).on("mouseenter.slick", i.proxy(e.interrupt, e, !0)).on("mouseleave.slick", i.proxy(e.interrupt, e, !1));
  }, e.prototype.initSlideEvents = function () {
    var e = this;
    e.options.pauseOnHover && (e.$list.on("mouseenter.slick", i.proxy(e.interrupt, e, !0)), e.$list.on("mouseleave.slick", i.proxy(e.interrupt, e, !1)));
  }, e.prototype.initializeEvents = function () {
    var e = this;
    e.initArrowEvents(), e.initDotEvents(), e.initSlideEvents(), e.$list.on("touchstart.slick mousedown.slick", {
      action: "start"
    }, e.swipeHandler), e.$list.on("touchmove.slick mousemove.slick", {
      action: "move"
    }, e.swipeHandler), e.$list.on("touchend.slick mouseup.slick", {
      action: "end"
    }, e.swipeHandler), e.$list.on("touchcancel.slick mouseleave.slick", {
      action: "end"
    }, e.swipeHandler), e.$list.on("click.slick", e.clickHandler), i(document).on(e.visibilityChange, i.proxy(e.visibility, e)), !0 === e.options.accessibility && e.$list.on("keydown.slick", e.keyHandler), !0 === e.options.focusOnSelect && i(e.$slideTrack).children().on("click.slick", e.selectHandler), i(window).on("orientationchange.slick.slick-" + e.instanceUid, i.proxy(e.orientationChange, e)), i(window).on("resize.slick.slick-" + e.instanceUid, i.proxy(e.resize, e)), i("[draggable!=true]", e.$slideTrack).on("dragstart", e.preventDefault), i(window).on("load.slick.slick-" + e.instanceUid, e.setPosition), i(e.setPosition);
  }, e.prototype.initUI = function () {
    var i = this;
    !0 === i.options.arrows && i.slideCount > i.options.slidesToShow && (i.$prevArrow.show(), i.$nextArrow.show()), !0 === i.options.dots && i.slideCount > i.options.slidesToShow && i.$dots.show();
  }, e.prototype.keyHandler = function (i) {
    var e = this;
    i.target.tagName.match("TEXTAREA|INPUT|SELECT") || (37 === i.keyCode && !0 === e.options.accessibility ? e.changeSlide({
      data: {
        message: !0 === e.options.rtl ? "next" : "previous"
      }
    }) : 39 === i.keyCode && !0 === e.options.accessibility && e.changeSlide({
      data: {
        message: !0 === e.options.rtl ? "previous" : "next"
      }
    }));
  }, e.prototype.lazyLoad = function () {
    function e(e) {
      i("img[data-lazy]", e).each(function () {
        var e = i(this),
          t = i(this).attr("data-lazy"),
          o = i(this).attr("data-srcset"),
          s = i(this).attr("data-sizes") || n.$slider.attr("data-sizes"),
          r = document.createElement("img");
        r.onload = function () {
          e.animate({
            opacity: 0
          }, 100, function () {
            o && (e.attr("srcset", o), s && e.attr("sizes", s)), e.attr("src", t).animate({
              opacity: 1
            }, 200, function () {
              e.removeAttr("data-lazy data-srcset data-sizes").removeClass("slick-loading");
            }), n.$slider.trigger("lazyLoaded", [n, e, t]);
          });
        }, r.onerror = function () {
          e.removeAttr("data-lazy").removeClass("slick-loading").addClass("slick-lazyload-error"), n.$slider.trigger("lazyLoadError", [n, e, t]);
        }, r.src = t;
      });
    }
    var t,
      o,
      s,
      n = this;
    if (!0 === n.options.centerMode ? !0 === n.options.infinite ? s = (o = n.currentSlide + (n.options.slidesToShow / 2 + 1)) + n.options.slidesToShow + 2 : (o = Math.max(0, n.currentSlide - (n.options.slidesToShow / 2 + 1)), s = n.options.slidesToShow / 2 + 1 + 2 + n.currentSlide) : (o = n.options.infinite ? n.options.slidesToShow + n.currentSlide : n.currentSlide, s = Math.ceil(o + n.options.slidesToShow), !0 === n.options.fade && (o > 0 && o--, s <= n.slideCount && s++)), t = n.$slider.find(".slick-slide").slice(o, s), "anticipated" === n.options.lazyLoad) for (var r = o - 1, l = s, d = n.$slider.find(".slick-slide"), a = 0; a < n.options.slidesToScroll; a++) r < 0 && (r = n.slideCount - 1), t = (t = t.add(d.eq(r))).add(d.eq(l)), r--, l++;
    e(t), n.slideCount <= n.options.slidesToShow ? e(n.$slider.find(".slick-slide")) : n.currentSlide >= n.slideCount - n.options.slidesToShow ? e(n.$slider.find(".slick-cloned").slice(0, n.options.slidesToShow)) : 0 === n.currentSlide && e(n.$slider.find(".slick-cloned").slice(-1 * n.options.slidesToShow));
  }, e.prototype.loadSlider = function () {
    var i = this;
    i.setPosition(), i.$slideTrack.css({
      opacity: 1
    }), i.$slider.removeClass("slick-loading"), i.initUI(), "progressive" === i.options.lazyLoad && i.progressiveLazyLoad();
  }, e.prototype.next = e.prototype.slickNext = function () {
    this.changeSlide({
      data: {
        message: "next"
      }
    });
  }, e.prototype.orientationChange = function () {
    var i = this;
    i.checkResponsive(), i.setPosition();
  }, e.prototype.pause = e.prototype.slickPause = function () {
    var i = this;
    i.autoPlayClear(), i.paused = !0;
  }, e.prototype.play = e.prototype.slickPlay = function () {
    var i = this;
    i.autoPlay(), i.options.autoplay = !0, i.paused = !1, i.focussed = !1, i.interrupted = !1;
  }, e.prototype.postSlide = function (e) {
    var t = this;
    t.unslicked || (t.$slider.trigger("afterChange", [t, e]), t.animating = !1, t.slideCount > t.options.slidesToShow && t.setPosition(), t.swipeLeft = null, t.options.autoplay && t.autoPlay(), !0 === t.options.accessibility && (t.initADA(), t.options.focusOnChange && i(t.$slides.get(t.currentSlide)).attr("tabindex", 0).focus()));
  }, e.prototype.prev = e.prototype.slickPrev = function () {
    this.changeSlide({
      data: {
        message: "previous"
      }
    });
  }, e.prototype.preventDefault = function (i) {
    i.preventDefault();
  }, e.prototype.progressiveLazyLoad = function (e) {
    e = e || 1;
    var t,
      o,
      s,
      n,
      r,
      l = this,
      d = i("img[data-lazy]", l.$slider);
    d.length ? (t = d.first(), o = t.attr("data-lazy"), s = t.attr("data-srcset"), n = t.attr("data-sizes") || l.$slider.attr("data-sizes"), (r = document.createElement("img")).onload = function () {
      s && (t.attr("srcset", s), n && t.attr("sizes", n)), t.attr("src", o).removeAttr("data-lazy data-srcset data-sizes").removeClass("slick-loading"), !0 === l.options.adaptiveHeight && l.setPosition(), l.$slider.trigger("lazyLoaded", [l, t, o]), l.progressiveLazyLoad();
    }, r.onerror = function () {
      e < 3 ? setTimeout(function () {
        l.progressiveLazyLoad(e + 1);
      }, 500) : (t.removeAttr("data-lazy").removeClass("slick-loading").addClass("slick-lazyload-error"), l.$slider.trigger("lazyLoadError", [l, t, o]), l.progressiveLazyLoad());
    }, r.src = o) : l.$slider.trigger("allImagesLoaded", [l]);
  }, e.prototype.refresh = function (e) {
    var t,
      o,
      s = this;
    o = s.slideCount - s.options.slidesToShow, !s.options.infinite && s.currentSlide > o && (s.currentSlide = o), s.slideCount <= s.options.slidesToShow && (s.currentSlide = 0), t = s.currentSlide, s.destroy(!0), i.extend(s, s.initials, {
      currentSlide: t
    }), s.init(), e || s.changeSlide({
      data: {
        message: "index",
        index: t
      }
    }, !1);
  }, e.prototype.registerBreakpoints = function () {
    var e,
      t,
      o,
      s = this,
      n = s.options.responsive || null;
    if ("array" === i.type(n) && n.length) {
      s.respondTo = s.options.respondTo || "window";
      for (e in n) if (o = s.breakpoints.length - 1, n.hasOwnProperty(e)) {
        for (t = n[e].breakpoint; o >= 0;) s.breakpoints[o] && s.breakpoints[o] === t && s.breakpoints.splice(o, 1), o--;
        s.breakpoints.push(t), s.breakpointSettings[t] = n[e].settings;
      }
      s.breakpoints.sort(function (i, e) {
        return s.options.mobileFirst ? i - e : e - i;
      });
    }
  }, e.prototype.reinit = function () {
    var e = this;
    e.$slides = e.$slideTrack.children(e.options.slide).addClass("slick-slide"), e.slideCount = e.$slides.length, e.currentSlide >= e.slideCount && 0 !== e.currentSlide && (e.currentSlide = e.currentSlide - e.options.slidesToScroll), e.slideCount <= e.options.slidesToShow && (e.currentSlide = 0), e.registerBreakpoints(), e.setProps(), e.setupInfinite(), e.buildArrows(), e.updateArrows(), e.initArrowEvents(), e.buildDots(), e.updateDots(), e.initDotEvents(), e.cleanUpSlideEvents(), e.initSlideEvents(), e.checkResponsive(!1, !0), !0 === e.options.focusOnSelect && i(e.$slideTrack).children().on("click.slick", e.selectHandler), e.setSlideClasses("number" == typeof e.currentSlide ? e.currentSlide : 0), e.setPosition(), e.focusHandler(), e.paused = !e.options.autoplay, e.autoPlay(), e.$slider.trigger("reInit", [e]);
  }, e.prototype.resize = function () {
    var e = this;
    i(window).width() !== e.windowWidth && (clearTimeout(e.windowDelay), e.windowDelay = window.setTimeout(function () {
      e.windowWidth = i(window).width(), e.checkResponsive(), e.unslicked || e.setPosition();
    }, 50));
  }, e.prototype.removeSlide = e.prototype.slickRemove = function (i, e, t) {
    var o = this;
    if (i = "boolean" == typeof i ? !0 === (e = i) ? 0 : o.slideCount - 1 : !0 === e ? --i : i, o.slideCount < 1 || i < 0 || i > o.slideCount - 1) return !1;
    o.unload(), !0 === t ? o.$slideTrack.children().remove() : o.$slideTrack.children(this.options.slide).eq(i).remove(), o.$slides = o.$slideTrack.children(this.options.slide), o.$slideTrack.children(this.options.slide).detach(), o.$slideTrack.append(o.$slides), o.$slidesCache = o.$slides, o.reinit();
  }, e.prototype.setCSS = function (i) {
    var e,
      t,
      o = this,
      s = {};
    !0 === o.options.rtl && (i = -i), e = "left" == o.positionProp ? Math.ceil(i) + "px" : "0px", t = "top" == o.positionProp ? Math.ceil(i) + "px" : "0px", s[o.positionProp] = i, !1 === o.transformsEnabled ? o.$slideTrack.css(s) : (s = {}, !1 === o.cssTransitions ? (s[o.animType] = "translate(" + e + ", " + t + ")", o.$slideTrack.css(s)) : (s[o.animType] = "translate3d(" + e + ", " + t + ", 0px)", o.$slideTrack.css(s)));
  }, e.prototype.setDimensions = function () {
    var i = this;
    !1 === i.options.vertical ? !0 === i.options.centerMode && i.$list.css({
      padding: "0px " + i.options.centerPadding
    }) : (i.$list.height(i.$slides.first().outerHeight(!0) * i.options.slidesToShow), !0 === i.options.centerMode && i.$list.css({
      padding: i.options.centerPadding + " 0px"
    })), i.listWidth = i.$list.width(), i.listHeight = i.$list.height(), !1 === i.options.vertical && !1 === i.options.variableWidth ? (i.slideWidth = Math.ceil(i.listWidth / i.options.slidesToShow), i.$slideTrack.width(Math.ceil(i.slideWidth * i.$slideTrack.children(".slick-slide").length))) : !0 === i.options.variableWidth ? i.$slideTrack.width(5e3 * i.slideCount) : (i.slideWidth = Math.ceil(i.listWidth), i.$slideTrack.height(Math.ceil(i.$slides.first().outerHeight(!0) * i.$slideTrack.children(".slick-slide").length)));
    var e = i.$slides.first().outerWidth(!0) - i.$slides.first().width();
    !1 === i.options.variableWidth && i.$slideTrack.children(".slick-slide").width(i.slideWidth - e);
  }, e.prototype.setFade = function () {
    var e,
      t = this;
    t.$slides.each(function (o, s) {
      e = t.slideWidth * o * -1, !0 === t.options.rtl ? i(s).css({
        position: "relative",
        right: e,
        top: 0,
        zIndex: t.options.zIndex - 2,
        opacity: 0
      }) : i(s).css({
        position: "relative",
        left: e,
        top: 0,
        zIndex: t.options.zIndex - 2,
        opacity: 0
      });
    }), t.$slides.eq(t.currentSlide).css({
      zIndex: t.options.zIndex - 1,
      opacity: 1
    });
  }, e.prototype.setHeight = function () {
    var i = this;
    if (1 === i.options.slidesToShow && !0 === i.options.adaptiveHeight && !1 === i.options.vertical) {
      var e = i.$slides.eq(i.currentSlide).outerHeight(!0);
      i.$list.css("height", e);
    }
  }, e.prototype.setOption = e.prototype.slickSetOption = function () {
    var e,
      t,
      o,
      s,
      n,
      r = this,
      l = !1;
    if ("object" === i.type(arguments[0]) ? (o = arguments[0], l = arguments[1], n = "multiple") : "string" === i.type(arguments[0]) && (o = arguments[0], s = arguments[1], l = arguments[2], "responsive" === arguments[0] && "array" === i.type(arguments[1]) ? n = "responsive" : void 0 !== arguments[1] && (n = "single")), "single" === n) r.options[o] = s;else if ("multiple" === n) i.each(o, function (i, e) {
      r.options[i] = e;
    });else if ("responsive" === n) for (t in s) if ("array" !== i.type(r.options.responsive)) r.options.responsive = [s[t]];else {
      for (e = r.options.responsive.length - 1; e >= 0;) r.options.responsive[e].breakpoint === s[t].breakpoint && r.options.responsive.splice(e, 1), e--;
      r.options.responsive.push(s[t]);
    }
    l && (r.unload(), r.reinit());
  }, e.prototype.setPosition = function () {
    var i = this;
    i.setDimensions(), i.setHeight(), !1 === i.options.fade ? i.setCSS(i.getLeft(i.currentSlide)) : i.setFade(), i.$slider.trigger("setPosition", [i]);
  }, e.prototype.setProps = function () {
    var i = this,
      e = document.body.style;
    i.positionProp = !0 === i.options.vertical ? "top" : "left", "top" === i.positionProp ? i.$slider.addClass("slick-vertical") : i.$slider.removeClass("slick-vertical"), void 0 === e.WebkitTransition && void 0 === e.MozTransition && void 0 === e.msTransition || !0 === i.options.useCSS && (i.cssTransitions = !0), i.options.fade && ("number" == typeof i.options.zIndex ? i.options.zIndex < 3 && (i.options.zIndex = 3) : i.options.zIndex = i.defaults.zIndex), void 0 !== e.OTransform && (i.animType = "OTransform", i.transformType = "-o-transform", i.transitionType = "OTransition", void 0 === e.perspectiveProperty && void 0 === e.webkitPerspective && (i.animType = !1)), void 0 !== e.MozTransform && (i.animType = "MozTransform", i.transformType = "-moz-transform", i.transitionType = "MozTransition", void 0 === e.perspectiveProperty && void 0 === e.MozPerspective && (i.animType = !1)), void 0 !== e.webkitTransform && (i.animType = "webkitTransform", i.transformType = "-webkit-transform", i.transitionType = "webkitTransition", void 0 === e.perspectiveProperty && void 0 === e.webkitPerspective && (i.animType = !1)), void 0 !== e.msTransform && (i.animType = "msTransform", i.transformType = "-ms-transform", i.transitionType = "msTransition", void 0 === e.msTransform && (i.animType = !1)), void 0 !== e.transform && !1 !== i.animType && (i.animType = "transform", i.transformType = "transform", i.transitionType = "transition"), i.transformsEnabled = i.options.useTransform && null !== i.animType && !1 !== i.animType;
  }, e.prototype.setSlideClasses = function (i) {
    var e,
      t,
      o,
      s,
      n = this;
    if (t = n.$slider.find(".slick-slide").removeClass("slick-active slick-center slick-current").attr("aria-hidden", "true"), n.$slides.eq(i).addClass("slick-current"), !0 === n.options.centerMode) {
      var r = n.options.slidesToShow % 2 == 0 ? 1 : 0;
      e = Math.floor(n.options.slidesToShow / 2), !0 === n.options.infinite && (i >= e && i <= n.slideCount - 1 - e ? n.$slides.slice(i - e + r, i + e + 1).addClass("slick-active").attr("aria-hidden", "false") : (o = n.options.slidesToShow + i, t.slice(o - e + 1 + r, o + e + 2).addClass("slick-active").attr("aria-hidden", "false")), 0 === i ? t.eq(t.length - 1 - n.options.slidesToShow).addClass("slick-center") : i === n.slideCount - 1 && t.eq(n.options.slidesToShow).addClass("slick-center")), n.$slides.eq(i).addClass("slick-center");
    } else i >= 0 && i <= n.slideCount - n.options.slidesToShow ? n.$slides.slice(i, i + n.options.slidesToShow).addClass("slick-active").attr("aria-hidden", "false") : t.length <= n.options.slidesToShow ? t.addClass("slick-active").attr("aria-hidden", "false") : (s = n.slideCount % n.options.slidesToShow, o = !0 === n.options.infinite ? n.options.slidesToShow + i : i, n.options.slidesToShow == n.options.slidesToScroll && n.slideCount - i < n.options.slidesToShow ? t.slice(o - (n.options.slidesToShow - s), o + s).addClass("slick-active").attr("aria-hidden", "false") : t.slice(o, o + n.options.slidesToShow).addClass("slick-active").attr("aria-hidden", "false"));
    "ondemand" !== n.options.lazyLoad && "anticipated" !== n.options.lazyLoad || n.lazyLoad();
  }, e.prototype.setupInfinite = function () {
    var e,
      t,
      o,
      s = this;
    if (!0 === s.options.fade && (s.options.centerMode = !1), !0 === s.options.infinite && !1 === s.options.fade && (t = null, s.slideCount > s.options.slidesToShow)) {
      for (o = !0 === s.options.centerMode ? s.options.slidesToShow + 1 : s.options.slidesToShow, e = s.slideCount; e > s.slideCount - o; e -= 1) t = e - 1, i(s.$slides[t]).clone(!0).attr("id", "").attr("data-slick-index", t - s.slideCount).prependTo(s.$slideTrack).addClass("slick-cloned");
      for (e = 0; e < o + s.slideCount; e += 1) t = e, i(s.$slides[t]).clone(!0).attr("id", "").attr("data-slick-index", t + s.slideCount).appendTo(s.$slideTrack).addClass("slick-cloned");
      s.$slideTrack.find(".slick-cloned").find("[id]").each(function () {
        i(this).attr("id", "");
      });
    }
  }, e.prototype.interrupt = function (i) {
    var e = this;
    i || e.autoPlay(), e.interrupted = i;
  }, e.prototype.selectHandler = function (e) {
    var t = this,
      o = i(e.target).is(".slick-slide") ? i(e.target) : i(e.target).parents(".slick-slide"),
      s = parseInt(o.attr("data-slick-index"));
    s || (s = 0), t.slideCount <= t.options.slidesToShow ? t.slideHandler(s, !1, !0) : t.slideHandler(s);
  }, e.prototype.slideHandler = function (i, e, t) {
    var o,
      s,
      n,
      r,
      l,
      d = null,
      a = this;
    if (e = e || !1, !(!0 === a.animating && !0 === a.options.waitForAnimate || !0 === a.options.fade && a.currentSlide === i)) if (!1 === e && a.asNavFor(i), o = i, d = a.getLeft(o), r = a.getLeft(a.currentSlide), a.currentLeft = null === a.swipeLeft ? r : a.swipeLeft, !1 === a.options.infinite && !1 === a.options.centerMode && (i < 0 || i > a.getDotCount() * a.options.slidesToScroll)) !1 === a.options.fade && (o = a.currentSlide, !0 !== t ? a.animateSlide(r, function () {
      a.postSlide(o);
    }) : a.postSlide(o));else if (!1 === a.options.infinite && !0 === a.options.centerMode && (i < 0 || i > a.slideCount - a.options.slidesToScroll)) !1 === a.options.fade && (o = a.currentSlide, !0 !== t ? a.animateSlide(r, function () {
      a.postSlide(o);
    }) : a.postSlide(o));else {
      if (a.options.autoplay && clearInterval(a.autoPlayTimer), s = o < 0 ? a.slideCount % a.options.slidesToScroll != 0 ? a.slideCount - a.slideCount % a.options.slidesToScroll : a.slideCount + o : o >= a.slideCount ? a.slideCount % a.options.slidesToScroll != 0 ? 0 : o - a.slideCount : o, a.animating = !0, a.$slider.trigger("beforeChange", [a, a.currentSlide, s]), n = a.currentSlide, a.currentSlide = s, a.setSlideClasses(a.currentSlide), a.options.asNavFor && (l = (l = a.getNavTarget()).slick("getSlick")).slideCount <= l.options.slidesToShow && l.setSlideClasses(a.currentSlide), a.updateDots(), a.updateArrows(), !0 === a.options.fade) return !0 !== t ? (a.fadeSlideOut(n), a.fadeSlide(s, function () {
        a.postSlide(s);
      })) : a.postSlide(s), void a.animateHeight();
      !0 !== t ? a.animateSlide(d, function () {
        a.postSlide(s);
      }) : a.postSlide(s);
    }
  }, e.prototype.startLoad = function () {
    var i = this;
    !0 === i.options.arrows && i.slideCount > i.options.slidesToShow && (i.$prevArrow.hide(), i.$nextArrow.hide()), !0 === i.options.dots && i.slideCount > i.options.slidesToShow && i.$dots.hide(), i.$slider.addClass("slick-loading");
  }, e.prototype.swipeDirection = function () {
    var i,
      e,
      t,
      o,
      s = this;
    return i = s.touchObject.startX - s.touchObject.curX, e = s.touchObject.startY - s.touchObject.curY, t = Math.atan2(e, i), (o = Math.round(180 * t / Math.PI)) < 0 && (o = 360 - Math.abs(o)), o <= 45 && o >= 0 ? !1 === s.options.rtl ? "left" : "right" : o <= 360 && o >= 315 ? !1 === s.options.rtl ? "left" : "right" : o >= 135 && o <= 225 ? !1 === s.options.rtl ? "right" : "left" : !0 === s.options.verticalSwiping ? o >= 35 && o <= 135 ? "down" : "up" : "vertical";
  }, e.prototype.swipeEnd = function (i) {
    var e,
      t,
      o = this;
    if (o.dragging = !1, o.swiping = !1, o.scrolling) return o.scrolling = !1, !1;
    if (o.interrupted = !1, o.shouldClick = !(o.touchObject.swipeLength > 10), void 0 === o.touchObject.curX) return !1;
    if (!0 === o.touchObject.edgeHit && o.$slider.trigger("edge", [o, o.swipeDirection()]), o.touchObject.swipeLength >= o.touchObject.minSwipe) {
      switch (t = o.swipeDirection()) {
        case "left":
        case "down":
          e = o.options.swipeToSlide ? o.checkNavigable(o.currentSlide + o.getSlideCount()) : o.currentSlide + o.getSlideCount(), o.currentDirection = 0;
          break;
        case "right":
        case "up":
          e = o.options.swipeToSlide ? o.checkNavigable(o.currentSlide - o.getSlideCount()) : o.currentSlide - o.getSlideCount(), o.currentDirection = 1;
      }
      "vertical" != t && (o.slideHandler(e), o.touchObject = {}, o.$slider.trigger("swipe", [o, t]));
    } else o.touchObject.startX !== o.touchObject.curX && (o.slideHandler(o.currentSlide), o.touchObject = {});
  }, e.prototype.swipeHandler = function (i) {
    var e = this;
    if (!(!1 === e.options.swipe || "ontouchend" in document && !1 === e.options.swipe || !1 === e.options.draggable && -1 !== i.type.indexOf("mouse"))) switch (e.touchObject.fingerCount = i.originalEvent && void 0 !== i.originalEvent.touches ? i.originalEvent.touches.length : 1, e.touchObject.minSwipe = e.listWidth / e.options.touchThreshold, !0 === e.options.verticalSwiping && (e.touchObject.minSwipe = e.listHeight / e.options.touchThreshold), i.data.action) {
      case "start":
        e.swipeStart(i);
        break;
      case "move":
        e.swipeMove(i);
        break;
      case "end":
        e.swipeEnd(i);
    }
  }, e.prototype.swipeMove = function (i) {
    var e,
      t,
      o,
      s,
      n,
      r,
      l = this;
    return n = void 0 !== i.originalEvent ? i.originalEvent.touches : null, !(!l.dragging || l.scrolling || n && 1 !== n.length) && (e = l.getLeft(l.currentSlide), l.touchObject.curX = void 0 !== n ? n[0].pageX : i.clientX, l.touchObject.curY = void 0 !== n ? n[0].pageY : i.clientY, l.touchObject.swipeLength = Math.round(Math.sqrt(Math.pow(l.touchObject.curX - l.touchObject.startX, 2))), r = Math.round(Math.sqrt(Math.pow(l.touchObject.curY - l.touchObject.startY, 2))), !l.options.verticalSwiping && !l.swiping && r > 4 ? (l.scrolling = !0, !1) : (!0 === l.options.verticalSwiping && (l.touchObject.swipeLength = r), t = l.swipeDirection(), void 0 !== i.originalEvent && l.touchObject.swipeLength > 4 && (l.swiping = !0, i.preventDefault()), s = (!1 === l.options.rtl ? 1 : -1) * (l.touchObject.curX > l.touchObject.startX ? 1 : -1), !0 === l.options.verticalSwiping && (s = l.touchObject.curY > l.touchObject.startY ? 1 : -1), o = l.touchObject.swipeLength, l.touchObject.edgeHit = !1, !1 === l.options.infinite && (0 === l.currentSlide && "right" === t || l.currentSlide >= l.getDotCount() && "left" === t) && (o = l.touchObject.swipeLength * l.options.edgeFriction, l.touchObject.edgeHit = !0), !1 === l.options.vertical ? l.swipeLeft = e + o * s : l.swipeLeft = e + o * (l.$list.height() / l.listWidth) * s, !0 === l.options.verticalSwiping && (l.swipeLeft = e + o * s), !0 !== l.options.fade && !1 !== l.options.touchMove && (!0 === l.animating ? (l.swipeLeft = null, !1) : void l.setCSS(l.swipeLeft))));
  }, e.prototype.swipeStart = function (i) {
    var e,
      t = this;
    if (t.interrupted = !0, 1 !== t.touchObject.fingerCount || t.slideCount <= t.options.slidesToShow) return t.touchObject = {}, !1;
    void 0 !== i.originalEvent && void 0 !== i.originalEvent.touches && (e = i.originalEvent.touches[0]), t.touchObject.startX = t.touchObject.curX = void 0 !== e ? e.pageX : i.clientX, t.touchObject.startY = t.touchObject.curY = void 0 !== e ? e.pageY : i.clientY, t.dragging = !0;
  }, e.prototype.unfilterSlides = e.prototype.slickUnfilter = function () {
    var i = this;
    null !== i.$slidesCache && (i.unload(), i.$slideTrack.children(this.options.slide).detach(), i.$slidesCache.appendTo(i.$slideTrack), i.reinit());
  }, e.prototype.unload = function () {
    var e = this;
    i(".slick-cloned", e.$slider).remove(), e.$dots && e.$dots.remove(), e.$prevArrow && e.htmlExpr.test(e.options.prevArrow) && e.$prevArrow.remove(), e.$nextArrow && e.htmlExpr.test(e.options.nextArrow) && e.$nextArrow.remove(), e.$slides.removeClass("slick-slide slick-active slick-visible slick-current").attr("aria-hidden", "true").css("width", "");
  }, e.prototype.unslick = function (i) {
    var e = this;
    e.$slider.trigger("unslick", [e, i]), e.destroy();
  }, e.prototype.updateArrows = function () {
    var i = this;
    Math.floor(i.options.slidesToShow / 2), !0 === i.options.arrows && i.slideCount > i.options.slidesToShow && !i.options.infinite && (i.$prevArrow.removeClass("slick-disabled").attr("aria-disabled", "false"), i.$nextArrow.removeClass("slick-disabled").attr("aria-disabled", "false"), 0 === i.currentSlide ? (i.$prevArrow.addClass("slick-disabled").attr("aria-disabled", "true"), i.$nextArrow.removeClass("slick-disabled").attr("aria-disabled", "false")) : i.currentSlide >= i.slideCount - i.options.slidesToShow && !1 === i.options.centerMode ? (i.$nextArrow.addClass("slick-disabled").attr("aria-disabled", "true"), i.$prevArrow.removeClass("slick-disabled").attr("aria-disabled", "false")) : i.currentSlide >= i.slideCount - 1 && !0 === i.options.centerMode && (i.$nextArrow.addClass("slick-disabled").attr("aria-disabled", "true"), i.$prevArrow.removeClass("slick-disabled").attr("aria-disabled", "false")));
  }, e.prototype.updateDots = function () {
    var i = this;
    null !== i.$dots && (i.$dots.find("li").removeClass("slick-active").end(), i.$dots.find("li").eq(Math.floor(i.currentSlide / i.options.slidesToScroll)).addClass("slick-active"));
  }, e.prototype.visibility = function () {
    var i = this;
    i.options.autoplay && (document[i.hidden] ? i.interrupted = !0 : i.interrupted = !1);
  }, i.fn.slick = function () {
    var i,
      t,
      o = this,
      s = arguments[0],
      n = Array.prototype.slice.call(arguments, 1),
      r = o.length;
    for (i = 0; i < r; i++) if ("object" == _typeof(s) || void 0 === s ? o[i].slick = new e(o[i], s) : t = o[i].slick[s].apply(o[i].slick, n), void 0 !== t) return t;
    return o;
  };
});

// // СЛАЙДЕР SLICK
// $(document).ready(function() {
//     $('.slider__body').slick({
//         arrows: false,
//         dots: true,
//         adaptiveHeight: true,
//         slidesToShow: 1,
//         slidesToScroll: 1,
//         speed: 500,
//         easing: 'ease',
//         infinite: true,
//         initialSlide: 0,
//         autoplay: false,
//         autoplaySpeed: 500,
//         pauseOnFocus: false,
//         pauseOnHover: true,
//         pauseOnDotsHover: true,
//         draggable: true,
//         swipe: true,
//         touchMove: false,
//         waitForAnimate: true,
//         centerMode: false,
//         rows: 1,
//     });
// });

// // СЛАЙДЕР SWIPER
// const mainSlider = new Swiper('.main-slider', {
//     navigation: {
//         nextEl: '.control-main-slider__arrow_next',
//         prevEl: '.control-main-slider__arrow_prev',
//     },

//     loop: true,
//     simulateTouch: true,
//     slidesPerView: 1,
//     spaceBetween: 30,
//     initialSlide: 0,
//     speed: 1000,

//     keyboard: {
//         enabled: true,
//         pageUpDown: false,
//     },

//     breakpoints: {
//         320: {
//             autoHeight: true,
//         },
//         768: {
//             autoHeight: false,
//         },
//     },
// });

// // СЛАЙДЕР SWIPER
// const saleSlider = new Swiper('.sale-slider', {
//     loop: true,
//     simulateTouch: true,
//     slidesPerView: 1,
//     spaceBetween: 30,
//     initialSlide: 0,
//     speed: 1000,
//     effect: 'fade',

//     pagination: {
//         el: '.sale-slider__pagination',
//         type: 'bullets',
//         clickable: true,
//         bulletClass: "sale-slider__bullet",
//         bulletActiveClass: "sale-slider__bullet_active",
//     },
// });

// // СЛАЙДЕР SWIPER
// const goodsSlider = new Swiper('.popular-goods__bottom', {
//     loop: false,
//     simulateTouch: true,
//     slidesPerView: 3,
//     spaceBetween: 30,
//     initialSlide: 0,
//     speed: 1000,
//     slidesPerGroup: 3,
//     //autoHeight: false,
//     slidesPerColumn: 2,

//     navigation: {
//         nextEl: '.top-popular-goods__arrow_next',
//         prevEl: '.top-popular-goods__arrow_prev',
//     },

//     pagination: {
//         el: '.top-popular-goods__fraction',
//         type: 'fraction',
//         renderFraction: function(currentClass, totalClass) {
//             return '<span class="' + currentClass +'"></span>' +
//                 '<span class="swiper-pagination-slash">/</span>' +
//                 '<span class="' + totalClass +'"></span>'
//         },
//     },

//     breakpoints: {
//         320: {
//             slidesPerView: 1,
//             spaceBetween: 10,
//             slidesPerGroup: 1,
//         },
//         500: {
//             slidesPerView: 2,
//             spaceBetween: 10,
//             slidesPerGroup: 2,
//         },
//         767: {
//             slidesPerView: 3,
//             spaceBetween: 10,
//             slidesPerGroup: 3,
//         },
//         950: {
//             slidesPerView: 2,
//             spaceBetween: 10,
//             slidesPerGroup: 2,
//         },
//         1050: {
//             slidesPerView: 3,
//             spaceBetween: 10,
//             slidesPerGroup: 3,
//         },
//         1140: {
//             spaceBetween: 30,
//         },
//     },
//     observer: true,
//     observeParents: true,
//     observeSlideChildren: true,
// });

// // СЛАЙДЕР SWIPER
// const sponsorsSlider = new Swiper('.sponsors-slider', {
//     loop: true,
//     simulateTouch: true,
//     slidesPerView: 5,
//     spaceBetween: 10,
//     initialSlide: 0,
//     speed: 1000,
//     slidesPerGroup: 1,

//     navigation: {
//         nextEl: '.sponsors__navigation_next',
//         prevEl: '.sponsors__navigation_prev',
//     },
//     breakpoints: {
//         320: {
//             slidesPerView: 1,
//         },
//         450: {
//             slidesPerView: 2,
//         },
//         767: {
//             slidesPerView: 3,
//         },
//         1140: {
//             slidesPerView: 5,
//         },
//     },
// });

// СЛАЙДЕР SWIPER 
if (document.querySelector('.mainslider')) {
  var mainSlider = new Swiper('.mainslider', {
    //loop: true,
    autoHeight: true,
    simulateTouch: true,
    slidesPerView: 1,
    initialSlide: 0,
    speed: 1000,
    // effect: 'fade',
    observer: true,
    observeParents: true,
    observeSlideChildren: true,
    pagination: {
      el: '.mainslider__dots',
      clickable: true
    }
  });
  var mainSLiderImages = document.querySelectorAll('.mainslider__image');
  var mainSLiderDots = document.querySelectorAll('.mainslider__dots .swiper-pagination-bullet');
  if (mainSLiderImages.length > 0) {
    for (var _index5 = 0; _index5 < mainSLiderImages.length; _index5++) {
      var mainSLiderImage = mainSLiderImages[_index5].querySelector('img').getAttribute('src');
      mainSLiderDots[_index5].style.backgroundImage = "url('" + mainSLiderImage + "')";
    }
  }
}
if (document.querySelector('.products-slider')) {
  var productsSlider = new Swiper('.products-slider__item', {
    autoHeight: true,
    simulateTouch: true,
    spaceBetween: 30,
    slidesPerView: 1,
    initialSlide: 0,
    speed: 1000,
    observer: true,
    observeParents: true,
    observeSlideChildren: true,
    navigation: {
      nextEl: '.products-slider__arrow_next',
      prevEl: '.products-slider__arrow_prev'
    },
    pagination: {
      el: '.products-slider__info',
      type: 'fraction'
    }
  });
}
if (document.querySelector('.brands-slider')) {
  var _productsSlider = new Swiper('.brands-slider__body', {
    loop: true,
    simulateTouch: true,
    spaceBetween: 0,
    slidesPerView: 5,
    initialSlide: 0,
    speed: 1000,
    observer: true,
    observeParents: true,
    observeSlideChildren: true,
    navigation: {
      nextEl: '.brands-slider__arrow_next',
      prevEl: '.brands-slider__arrow_prev'
    },
    breakpoints: {
      320: {
        slidesPerView: 1
      },
      480: {
        slidesPerView: 2
      },
      600: {
        slidesPerView: 3
      },
      768: {
        slidesPerView: 4
      },
      992: {
        slidesPerView: 5
      }
    }
  });
}
var goodSlider = new Swiper('.good__slider', {
  autoHeight: true,
  simulateTouch: true,
  spaceBetween: 0,
  slidesPerView: 1,
  initialSlide: 0,
  speed: 1000,
  observer: true,
  observeParents: true,
  observeSlideChildren: true,
  thumbs: {
    swiper: {
      el: '.mini-slider-good',
      slidesPerView: 4,
      spaceBetween: 10
    }
  }
});
if (document.querySelector('.product')) {
  var imagesSubSlider = new Swiper('.images-product__subslider', {
    //loop: true,
    simulateTouch: true,
    spaceBetween: 0,
    slidesPerView: 4,
    initialSlide: 0,
    speed: 1000,
    observer: true,
    observeParents: true,
    observeSlideChildren: true
  });
  var imagesMainSlider = new Swiper('.images-product__mainslider', {
    //loop: true,
    simulateTouch: true,
    spaceBetween: 0,
    slidesPerView: 1,
    initialSlide: 0,
    speed: 1000,
    observer: true,
    observeParents: true,
    observeSlideChildren: true,
    thumbs: {
      swiper: imagesSubSlider
    }
  });
}
// const popupLinks = document.querySelectorAll('.popup-link');
// const body = document.querySelector('body');
// const lockPadding = document.querySelectorAll('.lock-padding');

// let unlock = true;

// const timeout = 800;

// if (popupLinks.length > 0) {
//     for (let index = 0; index < popupLinks.length; index++) {
//         const popupLink = popupLinks[index];
//         popupLink.addEventListener("click", function (e) {
//             const popupName = popupLink.getAttribute('href').replace('#', '');
//             const currentPopup = document.getElementById(popupName);
//             popupOpen(currentPopup);
//             e.preventDefault();
//         });
//     }
// }

// const popupCloseIcon = document.querySelectorAll('.close-popup');
// if (popupCloseIcon.length > 0) {
//     for (let index = 0; index < popupCloseIcon.length; index++) {
//         const el = popupCloseIcon[index];
//         el.addEventListener("click", function (e) {
//             popupClose(el.closest('.popup'));
//             e.preventDefault();
//         });
//     }
// }

// function popupOpen(currentPopup) {
//     if (currentPopup && unlock) {
//         const popupActive = document.querySelector('.popup.open');
//         if (popupActive) {
//             popupClose(popupActive, false);
//         }
//         else {
//             bodyLock();
//         }
//         currentPopup.classList.add('open');
//         currentPopup.addEventListener("click", function (e) {
//             if (!e.target.closest('.popup__content')) {
//                 popupClose(e.target.closest('.popup'));
//             }
//         });
//     }
// }

// function popupClose(popupActive, doUnlock = true) {
//     if (unlock) {
//         popupActive.classList.remove('open');
//         if (doUnlock) {
//             bodyUnlock();
//         }
//     }
// }

// function bodyLock() {
//     const lockPaddingValue = window.innerWidth - document.querySelector('.wrapper').offsetWidth + 'px';
//     if (lockPadding.length > 0) {
//         for (let index = 0; index < lockPadding.length; index++) {
//             const el = lockPadding[index];
//             el.style.paddingRight = lockPaddingValue
//         }
//     }
//     body.style.paddingRight = lockPaddingValue;
//     body.classList.add('.lock');
//     unlock = false;
//     setTimeout(function () {
//         unlock = true;
//     }, timeout);
// }

// function bodyUnlock() {
//     setTimeout(function () {
//         if (lockPadding.length > 0) {
//             for (let index = 0; index < lockPadding.length; index++) {
//                 const el = lockPadding[index];
//                 el.style.paddingRight = '0px';
//             }
//         }
//         body.style.paddingRight = '0px';
//         body.classList.remove('.lock');
//     }, timeout);
//     unlock = false;
//     setTimeout(function () {
//         unlock = true;
//     }, timeout);
// }

// document.addEventListener("keydown", function (e) {
//     if (e.which === 27) {
//         const popupActive = document.querySelector('.popup.open');
//         popupClose(popupActive);
//     }
// });