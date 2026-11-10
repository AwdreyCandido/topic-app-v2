const valueParser = require("postcss-value-parser");

function convert(value, divisor) {
  return valueParser(value)
    .walk((node) => {
      if (node.type === "function" && node.value === "url") return false;
      if (node.type !== "word") return;
      node.value = node.value.replace(
        /(-?\d*\.?\d+)px\b/gi,
        (_match, amount) => {
          const number = Number(amount);
          return number === 0
            ? "0"
            : `${Number((number / divisor).toFixed(6))}rem`;
        },
      );
    })
    .toString();
}

module.exports = () => ({
  postcssPlugin: "topic-relative-lengths",
  OnceExit(root) {
    root.walkDecls((declaration) => {
      declaration.value = convert(declaration.value, 10);
    });
    root.walkAtRules((rule) => {
      rule.params = convert(rule.params, rule.name === "media" ? 16 : 10);
    });
  },
});
module.exports.postcss = true;
