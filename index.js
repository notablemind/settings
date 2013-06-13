
var SettingsManager = function (name) {
  this.name = name;
  this.items = [];
  this.named = {};
};

SettingsManager.prototype = {
  add: function (item) {
    if (this.named[item.name]) {
      throw new Error('name already used: ' + item.name);
    }
    this.items.push(item);
    this.process([], item, 'bool');
  },

  process: function(pre, item, type) {
    pre = pre.concat([item.name]);
    var name = pre.join('.');
    type = item.type || type;
    item.type = type;
    this.named[name] = item;
    if (item.settings) {
      item.settings.forEach(function(item) {
        this.process(pre, item, type);
      }.bind(this));
    }
  },

  get: function (name) {
    return this.named[name].value;
  },

  set: function (name, value) {
    this.named[name].value = value;
  },

  getSetting: function (name) {
    return this.named[name];
  },

  getType: function (name) {
    return this.named[name].type;
  },

  json: function () {
    var values = {};
    var names = Object.keys(this.named);
    for (var i=0; i<names.length; i++) {
      values[names[i]] = this.named[names[i]].value;
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
  getList: function (data) {
    var res = [];
    for (var i=0; i<data.length; i++) {
      res.push(this.named[data[i]].value);
    }
    return res;
  },

/** { key: settingName, ... } -> { key: settingValue } **/
  getHash: function (data) {
    var res = {}
      , keys = Object.keys(data);
    for (var i=0; i<keys.length; i++) {
      res[keys[i]] = this.named[data[keys[i]]].value;
    }
    return res;
  },

/** { settingName: value, ... } -> { settingValue: value, ... } */
  getHashKeys: function (data) {
    var res = {}
      , keys = Object.keys(data);
    for (var i=0; i<keys.length; i++) {
      res[this.named[keys[i]].value] = data[keys[i]];
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

