;(function ($) {

  var pluginName = "countdown";
  var defaults = {
    stepTime: 60
    , format: "dd:hh:mm:ss"
    , startTime: "01:12:32:55"
    , digitImages: 6
    , digitWidth: 67
    , digitHeight: 90
    , timerEnd: function () {}
    , image: "../img/digits.png"
    , continuous: false
  };

  function Plugin(element, options) {
    this.element = element;
    this.options = $.extend({}, defaults, options);
    this._defaults = defaults;
    this.digits = [];
    this.intervals = [];
    this._name = pluginName;
    this.init();
  }

  Plugin.prototype = {
    init: function () {
      var $this = this;
      $this._createDigits($this);
      this.intervals.main = setInterval(function () {
        $this._moveDigit($this.digits.length - 1);
      }, 1000);
    }
    , _margin: function (elem, val) {
      if (val !== undefined) {
        this.digits[elem].margin = val;
        return this.digits[elem].css({
          'backgroundPosition': '0 ' + val + 'px'
        });
      }

      return this.digits[elem].margin || 0;
    }
    , _nineMax: function(){ return 9; }
    , _posStartMax: function(pos, isStart){ if (pos % 2 === 0) return 2; else return (isStart) ? 3 : 9; }
    , _posMax: function(pos){ return (pos % 2 === 0) ? 5 : 9; }
    , _createDigits: function (where) {
      var c = 0;
      // Iterate each startTime digit, if it is not a digit
      // we'll asume that it's a separator
      for (var i = 0; i < this.options.startTime.length; i++) {
        if (parseInt(this.options.startTime[i], 10) >= 0) {
          elem = $('<div id="cnt_' + c + '" class="cntDigit" />').css({
            height: this.options.digitHeight
            , float: 'left'
            , background: 'url(\'' + this.options.image + '\')'
            , width: this.options.digitWidth
          });

          elem.current = parseInt(this.options.startTime[i], 10);
          this.digits.push(elem);

          this._margin(c, -elem.current * this.options.digitHeight * this.options.digitImages);

          if (this.options.continuous === true) {
            this.digits[c]._max = this._nineMax();
          } else {
            // Add max this.digits, for example, first digit of minutes (mm) has
            // a max of 5. Conditional max is used when the left digit has reach
            // the max. For example second "hours" digit has a conditional max of 4
            switch (this.options.format[i]) {
              case 'h':
                this.digits[c]._max = this._posStartMax;
                break;
              case 'd':
                this.digits[c]._max = this._nineMax;
                break;
              case 'm':
              case 's':
                this.digits[c]._max = this._posMax;
            }
          }

          ++c;
        } else {
          elem = $('<div class="cntSeparator"/>').css({
            float: 'left'
          })
            .text(this.options.startTime[i]);
        }
        $(this.element).append(elem)
      }
    }
    , _makeMovement: function (elem, steps, isForward) {
      var $this = this;
      // Stop any other movement over the same digit.
      if ($this.intervals[elem]) clearInterval($this.intervals[elem]);

      // Move to the initial position (We force that because in chrome
      // there are some scenarios where digits lost sync)
      var initialPos = -($this.options.digitHeight * $this.options.digitImages *
        $this.digits[elem].current);
      $this._margin(elem, initialPos);
      $this.digits[elem].current = $this.digits[elem].current + ((isForward) ? steps : -steps);

      var x = 0;
      $this.intervals[elem] = setInterval(function () {
        if (x++ === $this.options.digitImages * steps) {
          clearInterval($this.intervals[elem]);
          delete $this.intervals[elem];
          return;
        }
        var diff = isForward ? -$this.options.digitHeight : $this.options.digitHeight;
        $this._margin(elem, initialPos + (x * diff));
      }
      , $this.options.stepTime / steps);
    }
    , _moveDigit: function (elem) {
      var $this = this;
      if ($this.digits[elem].current === 0) {
        // Is there still time left?
        if (elem > 0) {
          var isStart = ($this.digits[elem - 1].current === 0);

          $this._makeMovement(elem, $this.digits[elem]._max(elem, isStart), true);
          $this._moveDigit(elem - 1);
        } else // That condition means that we reach the end! 00:00.
        {
          for (var i = 0; i < $this.digits.length; i++) {
            clearInterval($this.intervals[i]);
            clearInterval($this.intervals.main);
            $this._margin(i, 0);
          }
          $this.options.timerEnd();
        }

        return;
      }

      $this._makeMovement(elem, 1);
    }
    , reset: function () {
      var $this = this;
      var startTime = [];
      for (var i = 0; i < $this.options.startTime.length; i++) {
        if (parseInt(this.options.startTime[i], 10) >= 0) startTime.push(this.options.startTime[i]);
      }
      for (var j = 0; j < $this.digits.length; j++) {
        clearInterval($this.intervals[j]);
        clearInterval($this.intervals.main);
        $this._margin(j, -parseInt(startTime[j], 10) * $this.options.digitHeight * $this.options.digitImages);
      }
      $($this.element).empty();
      $this.digits = [];
      $this.intervals = [];
      $this.init();
    }
    , destroy: function () {
      var $this = this;
      for (var i = 0; i < $this.digits.length; i++) {
        clearInterval($this.intervals[i]);
        clearInterval($this.intervals.main);
        $this._margin(i, 0);
      }
      $($this.element).empty();
    }
  };

  $.fn[pluginName] = function (options) {
    var args = arguments;

    if (options === undefined || typeof options === 'object') {
      return this.each(function () {
        if (!$.data(this, 'plugin_' + pluginName)) {
          $.data(this, 'plugin_' + pluginName, new Plugin(this, options));
        }
      });
    } else if (typeof options === 'string' && options[0] !== '_' && options !== 'init') {
      var returns;
      this.each(function () {
        var instance = $.data(this, 'plugin_' + pluginName);
        if (instance instanceof Plugin && typeof instance[options] === 'function') {
          returns = instance[options].apply(instance, Array.prototype.slice.call(args, 1));
        }
        if (options === 'destroy') {
          $.data(this, 'plugin_' + pluginName, null);
        }
      });
      return returns !== undefined ? returns : this;
    }
  };

})(jQuery);