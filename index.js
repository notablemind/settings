
var valid = {
  sub: /^\w+$/,
  name: /^\w+(\.\w+)*$/
};

var SettingsManager = function (name, options) {
  this.name = name;
  options = options || {};
  options.log = options.log || console.error.bind(console);
  this.options = options;
  // { sub : { name: item, ... }, ... }
  this.subs = { '': {} };
  // { full:setting.name : {settingObj} }
  this.settings = {};
};

SettingsManager.prototype = {
  // automatically prepends sub + ':' to key lookups and writes
  sub: function (sub) {
    if (sub && !sub.match(valid.sub)) {
      throw new Error('Invalid sub referenced: ' + sub + '. Must be alphanumeric.');
    }
    sub = sub ? sub + ':' : '';
    if (!this.subs[sub]) {
      this.subs[sub] = {};
    }
    var that = this;
    var proxy = {
    };
    var nameFirst = ['get', 'set', 'getSetting', 'getType'];
    nameFirst.forEach(function (name) {
      proxy[name] = function () {
        arguments[0] = sub + arguments[0];
        return that[name].apply(that, arguments);
      };
    });
    var append = ['add', 'getList', 'getHash', 'getHasKeys'];
    append.forEach(function (name) {
      proxy[name] = function () {
        return that[name].apply(that, [].slice.call(arguments).concat([sub]));
      };
    });
    return proxy;
  },

  add: function (item, sub) {
    sub = sub || '';
    if (this.subs[sub][item.name]) {
      throw new Error('Settings section already defined: ' + (sub + item.name));
    }
    this.subs[sub][item.name] = item;
    this.process([], item, 'bool', sub, this.subs[sub]);
  },

  clear: function(){
    this.subs = {};
    this.settings = {};
  },

  process: function(pre, item, type, sub) {
    if (!item.name.match(valid.name)) {
      throw new Error('Invalid setting name: ' + item.name + '. Must be alphanumeric.');
    }
    pre = pre.concat([item.name]);
    var name = pre.join('.');
    type = item.type || type;
    item.type = type;
    if (item.settings) {
      item.settings.forEach(function(item) {
        this.process(pre, item, type, sub);
      }.bind(this));
    } else {
      this.settings[sub + name] = item;
    }
  },

  get: function (name) {
    if (!this.settings[name]) {
      var msg = 'Invalid setting requested: ' + name;
      if (this.failHard) {
        throw new Error(msg);
      }
      this.options.log(msg);
      return false;
    }
    return this.settings[name].value;
  },

  set: function (name, value) {
    if (!this.settings[name]) {
      var msg = 'Trying to set an invalid setting: ' + name;
      if (this.failHard) {
        throw new Error(msg);
      }
      this.options.log(msg);
      return;
    }
    this.settings[name].value = value;
  },

  getSetting: function (name) {
    return this.settings[name];
  },

  getType: function (name) {
    if (!this.settings[name]) {
      var msg = 'Trying to get an invalid setting: ' + name;
      if (this.failHard) {
        throw new Error(msg);
      }
      this.options.log(msg);
      return false;
    }
    return this.settings[name].type;
  },

  json: function () {
    var values = {};
    var names = Object.keys(this.settings);
    for (var i=0; i<names.length; i++) {
      if (typeof(this.settings[names[i]].value) === 'undefined') {
        continue;
      }
      values[names[i]] = this.settings[names[i]].value;
    }
    return values;
  },

  load: function (data) {
    var names = Object.keys(data);
    for (var i=0; i<names.length; i++) {
      this.set(names[i], data[names[i]]);
    }
  },

/** get a list of settings values **/
  getList: function (data, sub) {
    var res = [];
    sub = sub || '';
    for (var i=0; i<data.length; i++) {
      res.push(this.get(sub + data[i]));
    }
    return res;
  },

/** { key: settingName, ... } -> { key: settingValue } **/
  getHash: function (data, sub) {
    var res = {}
      , keys = Object.keys(data);
    sub = sub || '';
    for (var i=0; i<keys.length; i++) {
      res[keys[i]] = this.get(sub + data[keys[i]]);
    }
    return res;
  },

/** { settingName: value, ... } -> { settingValue: value, ... } */
  getHashKeys: function (data, sub) {
    var res = {}
      , keys = Object.keys(data);
    sub = sub || '';
    for (var i=0; i<keys.length; i++) {
      res[this.get(sub + keys[i])] = data[keys[i]];
    }
    return res;
  }
};

var single = new SettingsManager('default')
  , managers = {default: single};

module.exports = {
  SettingsManager: SettingsManager,
  getSettings: function(name) {
    name = name || 'default';
    if (!managers[name]) {
      managers[name] = new SettingsManager(name);
    }
    return managers[name];
  }
};

// make all the normal single.* available through module.exports
Object.keys(SettingsManager.prototype).forEach(function(name){
  module.exports[name] = single[name].bind(single);
});

