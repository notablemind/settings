
var valid = {
  sub: /^\w+$/,
  name: /^\w+(\.\w+)*$/,
  key: /^[^.]$/
};

var SettingsManager = function (name, options) {
  if (name.indexOf('.') !== -1) {
    throw new Error('Invalid manager name; must not contain "."');
  }
  this.name = name;
  this.all = {};
  this.settings = {};
}

SettingsManager.prototype = {

  // setup settings.
  // items: { key: setting, ... }
  //   key: can't contain "."
  //   setting: [ single | group ]
  //   group: { _group: true, key: setting, [key:setting, ...]}
  //   single: {
  //     title: str,
  //     description: str,
  //     class: HTML class to be applied when displayed
  //     type: str
  //     ... type-specific options
  //   }
  //
  // prefix: string; the place to insert the settings. "." separated path
  // override: (default false). If false, an error is raised if a
  //           setting is already present.
  config: function (items, prefix, override) {
    var base = this.all;
    if (prefix) {
      prefix.split('.').forEach(function (item) {
        if (!base[item]) base[item] = {};
        base = base[item];
      });
    }
    if (!items._type) items._type = 'bool';
    items._group = true;
    this.add(items, base, prefix, override);
  },

  // get a setting value. name is a "." separated path
  get: function (name) {
    if (!this.settings[name]) {
      console.warn('Unknown setting requested:', name);
      return;
    }
    return this.settings[name].value;
  },

  set: function (name, value) {
    if (!this.settings[name]) {
      console.warn('Trying to set an unknown setting:', name);
      return;
    }
    // TODO: some kind of validation here?
    // I figure if you're setting it manually, ou know what you're doing.
    this.settings[name].value = value;
  },

  // create a proxy, which treats all commands as relative to the provided path
  proxy: function (path) {
    var self = this;
    return {
      parent: this,
      config: function (items, prefix, override) {
        prefix = prefix ? path + '.' + prefix : path;
        return self.config(items, prefix, override);
      },
      get: function (key) {
        return self.get(path + '.' + key);
      },
      set: function (key, value) {
        return self.set(path + '.' + key, value);
      },
      getList: function (keys) {
        return self.getList(keys, path);
      },
      getHash: function (hash) {
        return self.getHash(hash, path);
      },
      getHaskKeys: function (hash) {
        return self.getHashKeys(hash, path);
      }
    };
  },

  // TODO: make this namespaceable? Or glob-style?
  json: function () {
    var result = {};
    for (var key in this.settings) {
      result[key] = this.settings[key].value;
    }
    return result;
  },
  
  getList: function (list, path) {
    var self = this;
    path = path ? path + '.' : '';
    return list.map(function (item) {
      return self.get(path + item);
    });
  },

  getHash: function (hash, path) {
    var obj = {};
    path = path ? path + '.' : '';
    for (var key in hash) {
      obj[key] = this.get(path + hash[key]);
    }
    return obj;
  },

  getHashKeys: function (hash, path) {
    var obj = {};
    path = path ? path + '.' : '';
    for (var key in hash) {
      obj[this.get(path + key)] = hash[key];
    }
    return obj;
  },

  // Used internally to recursively add setting definitions
  // items; see config
  // base: the object to which settings will be added. Should corrospond to the "path"
  // path: "." separated path to the given base
  // override: see config
  add: function (items, base, path, override) {
    if (!items._group) {
      throw new Error('you can only add groups');
    }
    path = path ? path + '.' : '';
    for (var key in items) {
      if (key === '_group' || key === '_type' || key === '_name') continue;
      if (key[0] === '_' || key.indexOf('.') !== -1) {
        throw new Error('invalid key name: ' + key + '. No periods and can\'t start with an underscore');
      }
      if (items[key]._group) {
        if (!base[key]) base[key] = {};
        items[key]._name = key;
        if (!items[key]._type) {
          items[key]._type = items._type;
        }
        this.add(items[key], base[key], path + key, override);
        continue;
      }
      if (base[key] && !override) {
        throw new Error('duplicate delaration of ' + key);
      }
      base[key] = items[key];
      items[key].name = key;
      if (!items[key].type) {
        items[key].type = items._type;
      }
      this.settings[path + key] = items[key]
    }
  },
};

var single = new SettingsManager('default')
  , managers = {default: single};

module.exports = function getSub(name) {
  if (!name) return single;
  return single.proxy(name);
};

module.exports.SettingsManager = SettingsManager;
module.exports.getSettings = function(name) {
  name = name || 'default';
  if (!managers[name]) {
    managers[name] = new SettingsManager(name);
  }
  return managers[name];
};
  
/*

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
    var append = ['add', 'getList', 'getHash', 'getHashKeys'];
    append.forEach(function (name) {
      proxy[name] = function () {
        return that[name].apply(that, [].slice.call(arguments).concat([sub]));
      };
    });
    return proxy;
  },

  getSub: function (sub) {
    return this.subs[sub ? sub + ':' : ''];
  },

  add: function (item, sub) {
    sub = sub || '';
    if (!this.subs[sub]) {
      this.subs[sub] = {};
    }
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

  getList: function (data, sub) {
    var res = [];
    sub = sub || '';
    for (var i=0; i<data.length; i++) {
      res.push(this.get(sub + data[i]));
    }
    return res;
  },

  getHash: function (data, sub) {
    var res = {}
      , keys = Object.keys(data);
    sub = sub || '';
    for (var i=0; i<keys.length; i++) {
      res[keys[i]] = this.get(sub + data[keys[i]]);
    }
    return res;
  },

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

module.exports = single;

single.SettingsManager = SettingsManager;
single.getSettings = function(name) {
  name = name || 'default';
  if (!managers[name]) {
    managers[name] = new SettingsManager(name);
  }
  return managers[name];
};
*/
