import fs from "node:fs";
import path from "node:path";
import postcss from "postcss";
import valueParser from "postcss-value-parser";
import ts from "typescript";

const failures = [];
const pixelLength = /(?:\d*\.)?\d+px\b/i;
const unitlessStyles = new Set([
  "opacity",
  "zIndex",
  "order",
  "flex",
  "flexGrow",
  "flexShrink",
  "fontWeight",
  "lineHeight",
  "aspectRatio",
  "scale",
  "gridRow",
  "gridColumn",
]);
function filesIn(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? filesIn(file) : [file];
  });
}
function hasPixels(value) {
  let found = false;
  valueParser(value).walk((node) => {
    if (node.type === "function" && node.value === "url") return false;
    if (node.type === "word" && pixelLength.test(node.value)) found = true;
  });
  return found;
}
const sourceFiles = ["app", "src", "data"].flatMap(filesIn);
for (const file of sourceFiles) {
  if (!/\.(?:css|s[ac]ss|less|tsx?|svg)$/.test(file)) continue;
  const source = fs.readFileSync(file, "utf8");
  if (pixelLength.test(source)) failures.push(`${file}: medida em px`);
  if (/\.(?:module\.css|s[ac]ss|less)$/.test(file))
    failures.push(`${file}: folha de estilos por componente`);
  if (file.endsWith(".css") && file !== "app/globals.css")
    failures.push(`${file}: use utilitários Tailwind no componente`);
  if (!file.endsWith(".tsx")) continue;
  const ast = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  function visit(node) {
    if (
      ts.isJsxAttribute(node) &&
      node.name.getText(ast) === "style" &&
      node.initializer &&
      ts.isJsxExpression(node.initializer) &&
      node.initializer.expression &&
      ts.isObjectLiteralExpression(node.initializer.expression)
    ) {
      for (const property of node.initializer.expression.properties) {
        if (!ts.isPropertyAssignment(property)) continue;
        const name = property.name.getText(ast).replaceAll(/["']/g, "");
        const value = property.initializer;
        if (
          ts.isNumericLiteral(value) &&
          Number(value.text) !== 0 &&
          !unitlessStyles.has(name)
        )
          failures.push(`${file}: style.${name} deve usar rem`);
      }
    }
    if (ts.isJsxOpeningElement(node) && node.tagName.getText(ast) === "style")
      failures.push(`${file}: estilos devem usar Tailwind`);
    ts.forEachChild(node, visit);
  }
  visit(ast);
}
const globals = fs.readFileSync("app/globals.css", "utf8");
if (!/html\s*\{\s*font-size:\s*62\.5%;\s*\}/.test(globals))
  failures.push("html deve usar font-size: 62.5%");
if (globals.trim().split("\n").length > 150)
  failures.push("globals.css excedeu 150 linhas");
const compiled = filesIn(".next/static/css").filter((file) =>
  file.endsWith(".css"),
);
for (const file of compiled) {
  const root = postcss.parse(fs.readFileSync(file, "utf8"));
  root.walkDecls((declaration) => {
    if (hasPixels(declaration.value))
      failures.push(`${file}: ${declaration.prop} contém px`);
  });
  root.walkAtRules((rule) => {
    if (hasPixels(rule.params))
      failures.push(`${file}: @${rule.name} contém px`);
  });
}
if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    `Estilos verificados: ${sourceFiles.length} arquivos de origem, ${compiled.length} CSS compilados, sem medidas em px.`,
  );
}
