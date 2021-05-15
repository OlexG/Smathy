module.exports = {
	env: {
		browser: true,
		es2021: true
	},
	extends: [
		'standard'
	],
	parserOptions: {
		ecmaVersion: 12,
		sourceType: 'module'
	},
	rules: {
		indent: ['error', 'tab'],
		'no-tabs': 0,
		semi: ['error', 'always'],
		'no-unused-expressions': 0
	}
};
