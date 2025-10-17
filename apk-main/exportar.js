const fs = require("fs");
const path = require("path");
const archiver = require("archiver");

const projectDir = process.cwd();
const outputPath = path.join(projectDir, "proyecto.zip");
const output = fs.createWriteStream(outputPath);
const archive = archiver("zip", { zlib: { level: 9 } });

// excluir node_modules y archivos innecesarios
archive.glob("**/*", {
  cwd: projectDir,
  ignore: ["node_modules/**", "proyecto.zip", "exportar.js"]
});

archive.pipe(output);
archive.finalize();

console.log("✅ Archivo proyecto.zip creado (sin node_modules)");
