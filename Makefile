
test: node_modules
	@./node_modules/.bin/mocha -R spec

node_modules:
	@npm install

.PHONY: test

