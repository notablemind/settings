
test: node_modules
	@./node_modules/.bin/mocha -R spec

coverage:
	@mocha -r blanket -R html-cov > coverage.html
	@open coverage.html

node_modules:
	@npm install

.PHONY: test

