import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import stylistic from "@stylistic/eslint-plugin";
import globals from "globals";

export default tseslint.config(
	{ ignores: [
		"dist/**",
		"node_modules/**",
	] },
	eslint.configs.recommended,
	...tseslint.configs.recommended,
	{
		files: ["**/*.ts", "**/*.js"],
		languageOptions: {
			globals: {
				...globals.node,
				...globals.browser,
			},
		},
		plugins: {
			"@stylistic": stylistic,
		},
		rules: {
			"@stylistic/quotes": [
				"error",
				"double",
				{ avoidEscape: true },
			],
			"@stylistic/indent": [
				"error",
				"tab",
			],
			"@stylistic/semi": [
				"error",
				"always",
			],
			"@stylistic/member-delimiter-style": [
				"error",
				{
					multiline: { delimiter: "semi",
						requireLast: true },
					singleline: { delimiter: "semi",
						requireLast: false },
				},
			],
			"@stylistic/type-annotation-spacing": [
				"error",
				{
					before: true,
					after: true,
					overrides: {
						colon: { before: true, after: true },
					}
				}
			],
			"@stylistic/object-curly-spacing": [
				"error",
				"always",
			],
			"@stylistic/object-property-newline": [
				"error",
				{ allowAllPropertiesOnSameLine: false },
			],
			"@stylistic/comma-dangle": [
				"error",
				"always-multiline",
			],
			"@stylistic/array-element-newline": [
				"error",
				"always",
			],
			"@stylistic/array-bracket-newline": [
				"error",
				"always",
			],
			"@stylistic/space-in-parens": [
				"error",
				"always",
			],
			"@stylistic/padding-line-between-statements": [
				"error",
				{ blankLine: "always",
					prev: "*",
					next: "return" },
			],
			"@stylistic/padded-blocks": [
				"error",
				"always",
				{ allowSingleLineBlocks: true },
			],
			"@stylistic/computed-property-spacing": [
				"error",
				"always",
			],
			"@stylistic/function-paren-newline": [
				"error",
				"multiline"
			],
			"@stylistic/function-call-argument-newline": [
				"error",
				"consistent"
			],
			"@stylistic/object-curly-newline": [
				"error",
				{
					ObjectExpression: { multiline: true, minProperties: 2, consistent: true },
					ObjectPattern: { multiline: true, consistent: true },
					ImportDeclaration: { multiline: true, minProperties: 4, consistent: true },
					ExportDeclaration: { multiline: true, minProperties: 4, consistent: true }
				}
			],
		},
	},
);
