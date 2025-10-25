// vite.config.js
import { defineConfig } from "vite";
import path from "path";
import fs from "fs";

function getHtmlEntryFiles(srcDir) {
  const entry = {};

  const files = fs.readdirSync(srcDir);

  files.forEach((file) => {
    const filePath = path.join(srcDir, file);

    if (path.extname(file) === ".html") {
      // If it's an HTML file, add it to the entry object
      const name = path.relative(srcDir, filePath).replace(/\..*$/, "");
      entry[name] = filePath;
    }
  });

  return entry;
}

export default defineConfig({
  build: {
    rollupOptions: {
      input: getHtmlEntryFiles(__dirname),
    },
  },
});
