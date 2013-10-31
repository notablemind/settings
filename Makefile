
test: lint test-only

lint:
	@jshint --verbose *.js *.json

test-only:
	@mocha -R spec

coverage:
	@mocha -r blanket -R html-cov > coverage.html
	@open coverage.html

.PHONY: test lint test-only coverage
