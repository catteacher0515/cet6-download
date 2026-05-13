import { access } from "node:fs/promises";
import { resolve } from "node:path";
import { papers } from "../src/data/cet6";

const publicDir = resolve(process.cwd(), "public");

async function main() {
  for (const paper of papers) {
    const pdfPath = resolve(publicDir, paper.pdfPath.replace(/^\//, ""));
    await access(pdfPath);

    if (paper.previewImagePath) {
      const previewImagePath = resolve(publicDir, paper.previewImagePath.replace(/^\//, ""));
      await access(previewImagePath);
    }

    if (paper.audioPath) {
      const audioPath = resolve(publicDir, paper.audioPath.replace(/^\//, ""));
      await access(audioPath);
    }
  }

  console.log(`validated ${papers.length} paper record(s)`);
}

main().catch((error) => {
  console.error("content validation failed");
  console.error(error);
  process.exit(1);
});
