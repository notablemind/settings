
var template = require('./bool-template')

module.exports = {
  clean: function (value) {
    if (value === 'true') return true;
    if (value === 'false') return false;
  },
  template: template
};
