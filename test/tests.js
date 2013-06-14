
var settings = require('..')
  , expect = require('chai').expect;

describe('SettingsManager, when initialized', function(){
  var mgr;
  beforeEach(function(){
    mgr = new settings.SettingsManager("test");
  });

  describe('sub', function () {
    it('should fail on bad sub name', function () {
      expect(mgr.sub.bind(mgr, 'a ')).to.throw(/alphanumeric/);
    });
  });

  describe('with a single item', function(){
    beforeEach(function(){
      mgr.add({name: 'key', value: true});
    });

    it('should retrieve', function(){
      expect(mgr.get('key')).to.be.true;
    });

    it('should set & retrieve', function(){
      mgr.set('key', false);
      expect(mgr.get('key')).to.be.false;
    });

    it('should default to type bool', function(){
      expect(mgr.getType('key')).to.eql('bool');
    });
  });

  describe('with a nested item', function(){
    beforeEach(function(){
      mgr.add({name: 'top',
               type: 'text',
               settings: [
                 {name: 'sub', type: 'bool', value: true},
                 {name: 'sub2', value: 'yes'}
               ]});
    });

    it('should be accessible as a.b', function(){
      expect(mgr.get('top.sub')).to.be.true;
      expect(mgr.get('top.sub2')).to.eql('yes');
    });

    it('should inherit type when not specified', function(){
      expect(mgr.getType('top.sub2')).to.eql('text');
    });

    it('should not inherit type when specified', function(){
      expect(mgr.getType('top.sub')).to.eql('bool');
    });

    it('should only include settings in the json', function(){
      expect(mgr.json()).to.eql({'top.sub':true, 'top.sub2': 'yes'});
    });

  });

  describe('with multiple items', function(){
    beforeEach(function(){
      mgr.add({name: 'xav', value: false});
      mgr.add({name: 'abc', value: true});
    });

    it('should serialize', function(){
      expect(mgr.json()).to.eql({xav: false, abc: true});
    });

  });

  describe('with a sub', function () {
    var sub;
    beforeEach(function () {
      sub = mgr.sub('test');
      sub.add({name: 'one', value: true});
      sub.add({name: 'two', value: 'man'});
    });

    it('should add things namespaced', function () {
      expect(mgr.get('test:one')).to.be.true;
    });

    it('should getList namespaced', function () {
      expect(sub.getList(['one', 'two'])).to.eql([true, 'man']);
    });
  });
    
});
