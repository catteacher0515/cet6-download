import { cp, mkdir } from "node:fs/promises";
import { basename, dirname, extname, resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { buildPaperAssetPaths, formatPaperSetNumber } from "../src/data/cet6";

const execFileAsync = promisify(execFile);
const PDFTOPPM_PATH = "/opt/homebrew/bin/pdftoppm";

export function parseYear(yearArg: string): number {
  const year = Number(yearArg);

  if (!Number.isInteger(year) || year < 2000) {
    throw new Error(`year 非法: ${yearArg}`);
  }

  return year;
}

export function parseMonth(monthArg: string): 6 | 12 {
  const month = Number(monthArg);

  if (month !== 6 && month !== 12) {
    throw new Error(`month 只能是 6 或 12，收到: ${monthArg}`);
  }

  return month;
}

export function parseSetNumber(setNumberArg: string): 1 | 2 | 3 {
  const setNumber = Number(setNumberArg);

  if (!Number.isInteger(setNumber) || setNumber < 1 || setNumber > 3) {
    throw new Error(`setNumber 只能是 1-3，收到: ${setNumberArg}`);
  }

  return setNumber as 1 | 2 | 3;
}

export function assertPdfFile(sourcePdfArg: string) {
  if (extname(sourcePdfArg).toLowerCase() !== ".pdf") {
    throw new Error(`sourcePdfPath 必须是 PDF 文件，收到: ${basename(sourcePdfArg)}`);
  }
}

export async function preparePaperAsset(year: number, month: 6 | 12, setNumber: number, sourcePdfArg: string) {
  assertPdfFile(sourcePdfArg);

  const sourcePdfPath = resolve(process.cwd(), sourcePdfArg);
  const assets = buildPaperAssetPaths(year, month, setNumber);
  const publicDir = resolve(process.cwd(), "public");
  const targetPdfPath = resolve(publicDir, assets.pdfPath.replace(/^\//, ""));
  const targetPreviewPath = resolve(publicDir, assets.previewImagePath.replace(/^\//, ""));
  const previewBasePath = targetPreviewPath.replace(/\.png$/, "");

  await mkdir(dirname(targetPdfPath), { recursive: true });
  await mkdir(dirname(targetPreviewPath), { recursive: true });
  await cp(sourcePdfPath, targetPdfPath);

  await execFileAsync(PDFTOPPM_PATH, [
    "-f",
    "1",
    "-singlefile",
    "-png",
    sourcePdfPath,
    previewBasePath
  ]);

  return {
    ...assets,
    setLabel: formatPaperSetNumber(setNumber)
  };
}

export function printPreparedPaper(result: {
  id: string;
  title: string;
  pdfPath: string;
  previewImagePath: string;
  setLabel: string;
}) {
  console.log("已准备真题资源：");
  console.log(`- PDF: ${result.pdfPath}`);
  console.log(`- 预览图: ${result.previewImagePath}`);
  console.log(`- 数据 id: ${result.id}`);
  console.log(`- 标题: ${result.title}`);
  console.log(`- 套数: ${result.setLabel}`);
}
