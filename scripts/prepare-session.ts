import { readFile, writeFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import { resolve } from "node:path";
import {
  buildPrepareSessionVerificationCommands,
  buildPaperRecordSnippet,
  buildSessionAssetPlan,
  insertPaperRecords,
  parsePrepareSessionArgs
} from "../src/data/cet6";
import { preparePaperAsset, printPreparedPaper } from "./prepare-paper-lib";

async function main() {
  if (process.argv.slice(2).length < 5) {
    console.error("用法: npm run prepare:session -- <year> <month> <set1PdfPath> <set2PdfPath> <set3PdfPath> [--verify]");
    process.exit(1);
  }

  const { year, month, sourcePdfs, verifyAfterImport } = parsePrepareSessionArgs(process.argv.slice(2));
  const plan = buildSessionAssetPlan(year, month);
  const dataFilePath = resolve(process.cwd(), "src/data/cet6.ts");
  const snippets = [1, 2, 3].map((setNumber) => buildPaperRecordSnippet(year, month, setNumber));

  console.log(`开始准备 ${year} 年 ${month} 月的 3 套真题资源`);

  for (const [index] of plan.entries()) {
    const result = await preparePaperAsset(year, month, index + 1, sourcePdfs[index]!);
    printPreparedPaper(result);
    console.log("");
  }

  const currentSource = await readFile(dataFilePath, "utf8");
  const nextSource = insertPaperRecords(currentSource, snippets);
  await writeFile(dataFilePath, nextSource, "utf8");

  console.log("本次半年资源准备完成。");
  console.log("已自动写入 src/data/cet6.ts");

  if (verifyAfterImport) {
    console.log("开始执行导入后自动校验...");

    for (const command of buildPrepareSessionVerificationCommands()) {
      console.log(`> ${command}`);
      execSync(command, { stdio: "inherit" });
    }

    console.log("导入后自动校验完成。");
    return;
  }

  console.log("下一步：运行 npm run validate:content && npm run test && npm run build");
}

main().catch((error) => {
  console.error("prepare session failed");
  console.error(error);
  process.exit(1);
});
