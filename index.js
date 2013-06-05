
var template = require('./template');

var _registry = {};
var register = function (type, obj) {
  _registry[type] = obj;
};

var SettingsManager = function (pages) {
  this.pages = pages;
  this.named = {};
  this.populateValues();
};

SettingsManager.prototype.populateValues = function () {
  for (var i=0; i<this.pages.length; i++) {
    var gtype = this.pages[i].type || null;
    if (gtype && !_registry[gtype]) {
      console.error('Unknown setting type encountered: ' + gtype);
    }
    for (var j=0; j<this.pages[i].settings.length; j++) {
      var setting = this.pages[i].settings[j];
      this.named[setting.name] = setting;
      this.named[setting.name].type = setting.type || gtype || 'bool';
      if (setting.type && !_registry[setting.type]) {
        console.error('Unknown setting type encountered: ' + setting.type);
      }
    }
  }
};

SettingsManager.prototype.get = function (name) {
  return this.named[name].value;
};

SettingsManager.prototype.set = function (name, value) {
  this.named[name].value = value;
};

SettingsManager.prototype.json = function () {
  var values = {};
  var names = Object.keys(this.named);
  for (var i=0; i<names.length; i++) {
    values[names[i]] = this.named[names[i]].value;
  }
  return values;
};

SettingsManager.prototype.load = function (data) {
  var names = Object.keys(data);
  for (var i=0; i<names.length; i++) {
    this.set(names[i], data[names[i]]);
  }
};

module.exports = {
  deps: {},
  directive: function() {
    return {
      scope: {},
      template: template,
      link: function (scope, element, attrs) {
        var name = attrs.settingsmanager;
        scope.$parent.$watch(name, function(value) {
          scope.settings = value;
        });
        scope.$watch('settings', function(value) {
          scope.$parent[name] = value;
        });
      }
    };
  },
  directives: {
    setting: [
      '$compile',
      function ($compile) {
        return {
          scope: {},
          link: function (scope, element, attrs) {
            var name = attrs.setting;
            var type;
            scope.$parent.$watch(name, function(value) {
              scope.setting = value;
              if (value.type !== type && _registry[value.type]) {
                type = value.type;
                var plugin = _registry[value.type];
                scope.validate = plugin.validate;
                var template = plugin.template;
                element.html(template);
                $compile(element.contents())(scope);
                var ngModel = scope.$parent['setting-form'].setting;
                if (plugin.validator) {
                  ngModel.$parsers.unshift(plugin.validator(scope, ngModel));
                }
              }
            });
            scope.$watch('setting', function(value) {
              scope.$parent[name] = value;
            });
          }
        }
      }]
  }
};

module.exports.SettingsManager = SettingsManager;
module.exports.register = register;

// load the built-in modules
var built_in = ['bool', 'radio', 'text'];
for (var i=0; i<built_in.length; i++) {
  register(built_in[i], require('./plugins/' + built_in[i]));
}
