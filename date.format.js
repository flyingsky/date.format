(function() {
  
  Date.shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  Date.longMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  Date.shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  Date.longDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // defining patterns
  var replaceChars = {
    // Day
    d: function() { return (this.getDate() < 10 ? '0' : '') + this.getDate(); },
    D: function() { return Date.shortDays[this.getDay()]; },
    j: function() { return this.getDate(); },
    l: function() { return Date.longDays[this.getDay()]; },
    N: function() { return (this.getDay() == 0 ? 7 : this.getDay()); },
    S: function() { return (this.getDate() % 10 == 1 && this.getDate() != 11 ? 'st' : (this.getDate() % 10 == 2 && this.getDate() != 12 ? 'nd' : (this.getDate() % 10 == 3 && this.getDate() != 13 ? 'rd' : 'th'))); },
    w: function() { return this.getDay(); },
    z: function() { var d = new Date(this.getFullYear(),0,1); return Math.ceil((this - d) / 86400000); }, // Fixed now
    // Week
    W: function() { 
      var target = new Date(this.valueOf());
      var dayNr = (this.getDay() + 6) % 7;
      target.setDate(target.getDate() - dayNr + 3);
      var firstThursday = target.valueOf();
      target.setMonth(0, 1);
      if (target.getDay() !== 4) {
        target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
      }
      return 1 + Math.ceil((firstThursday - target) / 604800000);
    },
    // Month
    F: function() { return Date.longMonths[this.getMonth()]; },
    m: function() { return (this.getMonth() < 9 ? '0' : '') + (this.getMonth() + 1); },
    M: function() { return Date.shortMonths[this.getMonth()]; },
    n: function() { return this.getMonth() + 1; },
    t: function() { var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 0).getDate(); }, // Fixed now, gets #days of date
    // Year
    L: function() { var year = this.getFullYear(); return (year % 400 == 0 || (year % 100 != 0 && year % 4 == 0)); },   // Fixed now
    o: function() { var d  = new Date(this.valueOf());  d.setDate(d.getDate() - ((this.getDay() + 6) % 7) + 3); return d.getFullYear();}, //Fixed now
    Y: function() { return this.getFullYear(); },
    y: function() { return ('' + this.getFullYear()).substr(2); },
    // Time
    a: function() { return this.getHours() < 12 ? 'am' : 'pm'; },
    A: function() { return this.getHours() < 12 ? 'AM' : 'PM'; },
    B: function() { return Math.floor((((this.getUTCHours() + 1) % 24) + this.getUTCMinutes() / 60 + this.getUTCSeconds() / 3600) * 1000 / 24); }, // Fixed now
    g: function() { return this.getHours() % 12 || 12; },
    G: function() { return this.getHours(); },
    h: function() { return ((this.getHours() % 12 || 12) < 10 ? '0' : '') + (this.getHours() % 12 || 12); },
    H: function() { return (this.getHours() < 10 ? '0' : '') + this.getHours(); },
    i: function() { return (this.getMinutes() < 10 ? '0' : '') + this.getMinutes(); },
    s: function() { return (this.getSeconds() < 10 ? '0' : '') + this.getSeconds(); },
    u: function() { var m = this.getMilliseconds(); return (m < 10 ? '00' : (m < 100 ?
                                                                             '0' : '')) + m; },
    // Timezone
    e: function() { return "Not Yet Supported"; },
    I: function() {
      var DST = null;
      for (var i = 0; i < 12; ++i) {
        var d = new Date(this.getFullYear(), i, 1);
        var offset = d.getTimezoneOffset();
        
        if (DST === null) DST = offset;
        else if (offset < DST) { DST = offset; break; }
        else if (offset > DST) break;
      }
      return (this.getTimezoneOffset() == DST) | 0;
    },
    O: function() { return (-this.getTimezoneOffset() < 0 ? '-' : '+') + (Math.abs(this.getTimezoneOffset() / 60) < 10 ? '0' : '') + (Math.abs(this.getTimezoneOffset() / 60)) + '00'; },
    P: function() { return (-this.getTimezoneOffset() < 0 ? '-' : '+') + (Math.abs(this.getTimezoneOffset() / 60) < 10 ? '0' : '') + (Math.abs(this.getTimezoneOffset() / 60)) + ':00'; }, // Fixed now
    T: function() { return this.toTimeString().replace(/^.+ \(?([^\)]+)\)?$/, '$1'); },
    Z: function() { return -this.getTimezoneOffset() * 60; },
    // Full Date/Time
    c: function() { return this.format("Y-m-d\\TH:i:sP"); }, // Fixed now
    r: function() { return this.toString(); },
    U: function() { return this.getTime() / 1000; }
  };

  // Simulates PHP's date function
  Date.prototype.format = function(format) {
    var date = this;
    return format.replace(/(\\?)(.)/g, function(_, esc, chr) {
      return (esc === '' && replaceChars[chr]) ? replaceChars[chr].call(date) : chr;
    });
  };

  function _isTimeStr(timeStr) {
    return timeStr.trim().indexOf('-') <= 0; // maybe negative timeStr, so index 0 is allowed
  }

  /**
   * @param timeStr {String} like '24:10:10', '1:1:1.12', hour:minute:second
   * @return {Number} in mill seconds
   */
  function _parseTimeStr(timeStr) {
    if (timeStr.indexOf(':') <= 0) { // only for seconds
      return parseFloat(timeStr * 1000);
    }

    var hms = timeStr.split(':');
    var result = 0;
    var len = 3;
    for (var i = 0; i < len; i++) { // h:m:s
      var value = hms[i] || 0;
      result = result * 60 + ((i === len - 1) ? parseFloat(value) : parseInt(value)); // only second part maybe float number
    }

    if (hms.length < len && timeStr.lastIndexOf('.') > 0) { // 2:2.1 means 2 hours 2 minutes and 0.1 seconds
      result += parseFloat(timeStr.substr(timeStr.lastIndexOf('.')));
    }
      
    return result * 1000;
  }

  /**
   * @param timeStr {String} like '1 1:1:1', '-2 2:2' day hour:minute:second
   */
  function _parseTimeExpr(timeExpr) {
    timeExpr = timeExpr.trim();
    var sign = timeExpr[0] === '-' ? -1 : 1;
    if (sign === -1) {
      timeExpr = timeExpr.substr(1);
    }
    
    var dayAndTime = timeExpr.trim().split(/\s+/);
    if (dayAndTime.length > 2) {
      return 0;                 // invalid timeStr
    }

    var day = 0;
    var timeStr = 0;
    if (dayAndTime.length === 2) {
      day = parseInt(dayAndTime[0]);
      timeStr = dayAndTime[1];
    } else {
      timeStr = dayAndTime[0];
    }

    var DAY_TO_MILLISECONDS = 24 * 3600 * 1000;

    return (day * DAY_TO_MILLISECONDS + _parseTimeStr(timeStr)) * sign;
  }

  function _paddingZeroRight(number, len) {
    var str = number.toString();
    if (str.length < len) {
      str = '0' + str;
    }
    return str;
  }
  
  /**
   * @param milliseconds {Number}
   * @return {String} such as '27:30:29.234'
   */
  function _formatToTimeExpr(milliseconds) {
    var str = milliseconds.toString();
    var dotPart = '';
    var dotIndex = str.indexOf('.');
    if (dotIndex > 0) {
      dotPart = str.substr(dotIndex + 1);
      str = str.substr(0, dotIndex);
    }
    
    milliseconds = parseInt(str);
    var milli = milliseconds % 1000;
    var seconds = (milliseconds - milli) / 1000;
    var minutes = (seconds - seconds % 60) / 60;
    seconds = seconds % 60;
    var hours = (minutes - minutes % 60) / 60;
    minutes = minutes % 60;

    var result = [_paddingZeroRight(hours, 2), _paddingZeroRight(minutes, 2), _paddingZeroRight(seconds, 2)].join(':');
    var milliStr = _paddingZeroRight(milli, 3) + dotPart;
    if (milliStr.replace(/0/g, '').length === 0) { // all 0
      milliStr = '';
    } else {
      milliStr = '.' + milliStr;
    }
    
    return result + milliStr;
  }

  Date.prototype.addTime = function(milliseconds) {
    var d = this;
    
    if (typeof(milliseconds) === 'string') { // time expr
      milliseconds = _parseTimeExpr(milliseconds);
    }
    
    d.setTime(d.getTime() + milliseconds);
  };
  
  /**
   * Same to Mysql ADDTIME function
   * @param timeExpr1 {String} Date string or time string
   * @param timeExpr2 {String} time string
   * @return {String} Date string or time string
   */
  Date.addTime = function(timeExpr1, timeExpr2) {
    if (_isTimeStr(timeExpr1)) {
      var milliseconds = _parseTimeExpr(timeExpr1) + _parseTimeExpr(timeExpr2);
      return _formatToTimeExpr(milliseconds);
    } else {
      var d = new Date(timeExpr1); // how to handle time1 is not date
      d.addTime(timeExpr2);
      return d.format('Y-m-d H:i:s.u');
    }
  };
}).call(this);
