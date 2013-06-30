
var settings = require('..')
  , expect = require('chai').expect;

describe('SettingsManager, when initialized', function(){
  var mgr;
  beforeEach(function(){
    mgr = new settings.SettingsManager("test");
  });

  describe('with a single item', function(){
    beforeEach(function(){
      mgr.config({key: {value: true}});
    });

    it('should retrieve', function(){
      expect(mgr.get('key')).to.be.true;
    });

    it('should set & retrieve', function(){
      mgr.set('key', false);
      expect(mgr.get('key')).to.be.false;
    });
  });

  describe('with a nested item', function(){
    beforeEach(function(){
      mgr.config({
        top: {
          _group: true,
          _type: 'text',
          sub: {type: 'bool', value: true},
          sub2: {value: 'yes'}
        }});
    });

    it('should be accessible as a.b', function(){
      expect(mgr.get('top.sub')).to.be.true;
      expect(mgr.get('top.sub2')).to.eql('yes');
    });

    it('should inherit type when not specified', function(){
      expect(mgr.settings['top.sub2'].type).to.eql('text');
    });

    it('should not inherit type when specified', function(){
      expect(mgr.settings['top.sub'].type).to.eql('bool');
    });

    it('should only include settings in the json', function(){
      expect(mgr.json()).to.eql({'top.sub':true, 'top.sub2': 'yes'});
    });

  });

  describe('with multiple items', function(){
    beforeEach(function(){
      mgr.config({xav: {value: false}});
      mgr.config({abc: {value: true}});
    });

    it('should serialize', function(){
      expect(mgr.json()).to.eql({xav: false, abc: true});
    });

  });

  describe('with a sub', function () {
    var sub;
    beforeEach(function () {
      sub = mgr.proxy('test');
      sub.config({one: {value: true}});
      sub.config({two: {value: 'man'}});
    });

    it('should add things namespaced', function () {
      expect(mgr.get('test.one')).to.be.true;
    });

    it('should getList namespaced', function () {
      expect(sub.getList(['one', 'two'])).to.eql([true, 'man']);
    });
  });
    
});
