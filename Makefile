
test: node_modules
	mocha -R spec

node_modules:
	@npm install

