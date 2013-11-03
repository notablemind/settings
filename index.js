
var valid = {
  sub: /^\w+$/,
  name: /^\w+(\.\w+)*$/,
  key: /^[^.]$/
};

function escapeRegex(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
}

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
      getHashKeys: function (hash) {
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

  load: function (hash) {
    for (var key in hash) {
      // I think the right thing to do is ignore unrecognized values
      if (!this.settings[key]) continue;
      this.settings[key].value = hash[key];
    }
  },

  /*
  getAll: function (path) {
    var base = this.all
      , res = [];
    parts = path ? path.split('.') : [];
    parts.forEach(function (part) {
      base = base[part];
    });
    for (var key in base) {
      if (key[0] === '_') continue;
      res.push(base[key]);
    }
    return res;
  },
  */

  // get all settings that match a glob-style pattern
  // * will match anything but a period. ** will match anything
  match: function (pattern) {
    if (this.settings[pattern]) return [this.settings[pattern]];
    if (pattern.indexOf('*') === -1) {
      return [];
    }
    if (pattern === '**') {
      pattern = true;
    } else {
      pattern = escapeRegex(pattern);
      pattern = pattern.replace(/\\\*\\\*/g, '.*?');
      pattern = pattern.replace(/\\\*/g, '[^.]*?');
      pattern = new RegExp('^' + pattern + '$');
    }
    var settings = [];
    for (var key in this.settings) {
      if (pattern === true || pattern.test(key)) {
        settings.push(this.settings[key]);
      }
    }
    return settings;
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

  clear: function () {
    this.all = {};
    this.settings = {};
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
      if (key[0] === '_' || key.indexOf('.') !== -1 || key.indexOf('*') !== -1) {
        throw new Error('invalid key name: ' + key + '. No periods or asterisks and can\'t start with an underscore');
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

