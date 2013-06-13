
var settings = require('..')
  , expect = require('chai').expect;

describe('SettingsManager, when initialized', function(){
  var mgr;
  beforeEach(function(){
    mgr = new settings.SettingsManager("test");
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

  });

  describe('with multiple items', function(){
    beforeEach(function(){
      mgr.add({name: 'xav', value: false});
      mgr.add({name: 'abc', value: true});
    });

    it('should serialize', function(){
      expect(mgr.json()).to.eql({xav: false, abc: true});
    });

    it('should have items in order', function(){
      expect(mgr.items[0].name).to.eql('xav');
      expect(mgr.items[1].name).to.eql('abc');
    });

  });
    
});
