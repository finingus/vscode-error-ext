import eslint from "@eslint/js";
import prettier from "eslint-config-prettier";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import stylistic from "@stylistic/eslint-plugin";

const FUNCTION_VALUED_DECLARATION_SELECTOR =
  "VariableDeclaration:has(VariableDeclarator > ArrowFunctionExpression), " +
  "VariableDeclaration:has(VariableDeclarator > FunctionExpression), " +
  "VariableDeclaration:has(VariableDeclarator > CallExpression[callee.object.name='jest'][callee.property.name='fn'])";

const CALL_STATEMENT_SELECTOR =
  "ExpressionStatement[expression.type='CallExpression'], " +
  "ExpressionStatement[expression.type='ChainExpression'][expression.expression.type='CallExpression'], " +
  "ExpressionStatement[expression.type='UnaryExpression'][expression.operator='void'][expression.argument.type='CallExpression']";

export default defineConfig(
  { ignores: ["out/", "node_modules/"] },
  eslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    files: ["**/*.ts", "**/*.tsx"],

    plugins: {
      "@stylistic": stylistic,
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      curly: "error",
      eqeqeq: "error",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "prefer-const": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        { allowNumber: true },
      ],
      "@typescript-eslint/switch-exhaustiveness-check": "error",

      "@stylistic/padding-line-between-statements": [
        "warn",
        // blank line required after the last import, before the first statement
        {
          blankLine: "always",
          prev: "import",
          next: "*",
        },
        // consecutive imports can stay grouped with no blank line
        {
          blankLine: "any",
          prev: "import",
          next: "import",
        },
        // blank line required before every `return|export|interface|type|if|for|while|switch|try|do|break`
        {
          blankLine: "always",
          prev: "*",
          next: [
            "return",
            "export",
            "interface",
            "type",
            "if",
            "for",
            "while",
            "switch",
            "try",
            "do",
            "break",
            "case",
            "default",
          ],
        },
        // a fallthrough case (no statements in its body) can stay grouped with the next case/default
        {
          blankLine: "any",
          prev: { selector: "SwitchCase[consequent.length=0]" },
          next: ["case", "default"],
        },
        // consecutive export statements (e.g. barrel files) can stay grouped with no blank line
        {
          blankLine: "any",
          prev: "export",
          next: "export",
        },
        // blank line required after a group of declarations, before the next step
        {
          blankLine: "always",
          prev: ["const", "let", "var"],
          next: "*",
        },
        // consecutive declarations (same concept) can stay grouped with no blank line
        {
          blankLine: "any",
          prev: ["const", "let", "var"],
          next: ["const", "let", "var"],
        },
        // blank line required after a destructured object declaration (e.g. `const { a, b } = x();`),
        // even when followed by another const/let/var declaration
        {
          blankLine: "always",
          prev: {
            selector:
              "VariableDeclaration:has(VariableDeclarator > ObjectPattern)",
          },
          next: "*",
        },
        // blank line required between a call-statement and a following assignment-statement or variable declaration
        {
          blankLine: "always",
          prev: {
            selector: "ExpressionStatement[expression.type='CallExpression']",
          },
          next: [
            "const",
            "let",
            "var",
            {
              selector:
                "ExpressionStatement[expression.type='AssignmentExpression']",
            },
          ],
        },
        // blank line required between an assignment-statement and a following call-statement,
        // variable declaration, (also matches calls wrapped in `void`, e.g. `void someAsyncCall()`)
        {
          blankLine: "always",
          prev: {
            selector:
              "ExpressionStatement[expression.type='AssignmentExpression']",
          },
          next: [
            "const",
            "let",
            "var",
            {
              selector:
                "ExpressionStatement[expression.type='CallExpression'], ExpressionStatement[expression.type='UnaryExpression'][expression.operator='void']",
            },
          ],
        },
        // blank line required between a call-statement (e.g. `obj.method()`, `fn()`, `void fn()`)
        // and a following multiline expression-statement; consecutive single-line calls can stay grouped
        {
          blankLine: "always",
          prev: { selector: CALL_STATEMENT_SELECTOR },
          next: "multiline-expression",
        },
        // blank line required before a call with a block-bodied callback (e.g. setTimeout(() => {...})) or a console.log call
        {
          blankLine: "always",
          prev: "*",
          next: {
            selector:
              "ExpressionStatement:has(ArrowFunctionExpression[body.type='BlockStatement']), ExpressionStatement:has(FunctionExpression), ExpressionStatement[expression.type='CallExpression'][expression.callee.type='MemberExpression'][expression.callee.object.name='console'][expression.callee.property.name='log']",
          },
        },
        // blank line required after a console.log call (no-op when it's the last statement in a block,
        // since there is no following statement to pair with, so no blank line is forced before `}`)
        {
          blankLine: "always",
          prev: {
            selector:
              "ExpressionStatement[expression.type='CallExpression'][expression.callee.type='MemberExpression'][expression.callee.object.name='console'][expression.callee.property.name='log']",
          },
          next: "*",
        },
        // blank line required before a const/let/var whose initializer is a function
        // (arrow function, function expression, or jest.fn()), when it directly follows
        // another const/let/var (overrides the "stay grouped" rule above)
        {
          blankLine: "always",
          prev: ["const", "let", "var"],
          next: { selector: FUNCTION_VALUED_DECLARATION_SELECTOR },
        },
        // blank line required before a multiline const/let/var when it directly follows
        // another const/let/var (overrides the "stay grouped" rule above)
        {
          blankLine: "always",
          prev: ["const", "let", "var"],
          next: ["multiline-const", "multiline-let", "multiline-var"],
        },
        // blank line required after a block-like statement or a function-valued declaration, before the next step
        {
          blankLine: "always",
          prev: [
            "block-like",
            { selector: FUNCTION_VALUED_DECLARATION_SELECTOR },
          ],
          next: "*",
        },
        // consecutive function-valued declarations can stay grouped with no blank line
        // (overrides the two rules above)
        {
          blankLine: "any",
          prev: { selector: FUNCTION_VALUED_DECLARATION_SELECTOR },
          next: { selector: FUNCTION_VALUED_DECLARATION_SELECTOR },
        },
        // blank line required after a multiline const/let/var (overrides the "stay grouped" rule above)
        {
          blankLine: "always",
          prev: ["multiline-const", "multiline-let", "multiline-var"],
          next: "*",
        },
        // blank line required after a multiline expression-statement (e.g. a call spanning multiple lines)
        {
          blankLine: "always",
          prev: "multiline-expression",
          next: "*",
        },
      ],

      "@stylistic/no-multiple-empty-lines": [
        "warn",
        { max: 1, maxEOF: 0, maxBOF: 0 },
      ],
      "@stylistic/padded-blocks": ["warn", "never"],
      "@stylistic/lines-between-class-members": [
        "warn",
        "always",
        { exceptAfterSingleLine: true },
      ],
    },
  },
  {
    files: ["eslint.config.ts"],
    extends: [tseslint.configs.disableTypeChecked],
  },
  prettier,
);
