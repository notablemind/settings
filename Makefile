
plugin_tpl := $(patsubst %.jade,%.js,$(wildcard plugins/*.jade))

build: components index.js settings.styl template.js plugin-tpl
	@component build --dev

template.js: template.html
	@component convert $<

template.html: template.jade
	@jade template.jade

plugin-tpl: $(plugin_tpl)

plugins/%.js: plugins/%.html
	@component convert $<

plugins/%.html: plugins/%.jade
	@jade $<

components: component.json
	@component install --dev

clean:
	rm -fr build components template.js

.PHONY: clean
