
var template = require('./radio-template');

module.exports = {
  vaidate: function (value, setting) {
    return setting.options.indexOf(value) !== -1;
  },
  template: template
};
