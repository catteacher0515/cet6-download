import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import JSZip from "jszip";
import { buildBatchDownloadFilename, buildDefaultBatchArchivePath, papers } from "../src/data/cet6.ts";

async function main() {
  const publicDir = resolve(process.cwd(), "public");
  const archivePath = resolve(publicDir, buildDefaultBatchArchivePath().replace(/^\//, ""));

  await mkdir(dirname(archivePath), { recursive: true });
  await rm(archivePath, { force: true });

  const zip = new JSZip();

  for (const paper of papers) {
    const pdfPath = resolve(publicDir, paper.pdfPath.replace(/^\//, ""));
    const filename = buildBatchDownloadFilename(paper.year, paper.month, paper.setNumber);
    zip.file(filename, await readFile(pdfPath));
  }

  const zipBuffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "STORE"
  });

  await writeFile(archivePath, zipBuffer);

  console.log(`generated batch archive: ${archivePath}`);
  console.log(`papers included: ${papers.length}`);
}

main().catch((error) => {
  console.error("generate batch archive failed");
  console.error(error);
  process.exit(1);
});
