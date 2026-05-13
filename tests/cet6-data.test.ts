import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import {
  buildBatchDownloadFilename,
  buildDefaultBatchArchivePath,
  buildPaperAssetPaths,
  buildPaperPreviewPagePath,
  buildPaperRecordSnippet,
  buildSessionAssetPlan,
  groupPapersBySession,
  insertPaperRecords,
  papers,
  parsePrepareSessionArgs,
  sortPapers
} from "../src/data/cet6";

const rootDir = resolve(process.cwd());

test("papers 至少包含一条演示数据", () => {
  assert.equal(papers.length, 30);
});

test("papers 使用 year-month-setNumber 进行分组", () => {
  const groups = groupPapersBySession(papers);
  assert.equal(groups.length, 10);
  assert.equal(groups[0]?.label, "2025 年 12 月");
  assert.equal(groups[0]?.papers.length, 3);
  assert.equal(groups.at(-1)?.label, "2021 年 6 月");
  assert.equal(groups.at(-1)?.papers.length, 3);
});

test("新增真题时会生成稳定的文件路径和标题", () => {
  assert.deepEqual(buildPaperAssetPaths(2026, 6, 2), {
    id: "cet6-2026-06-set-02",
    title: "2026年6月英语六级真题(第2套)",
    pdfPath: "/papers/2026/06/cet6-2026-06-set-02.pdf",
    previewImagePath: "/previews/2026/06/cet6-2026-06-set-02.png"
  });
});

test("批量下载会生成面向用户的中文文件名", () => {
  assert.equal(buildBatchDownloadFilename(2025, 12, 1), "2025年12月第1套.pdf");
  assert.equal(buildBatchDownloadFilename(2024, 6, 3), "2024年6月第3套.pdf");
});

test("默认全选批量下载会使用固定整包 zip 路径", () => {
  assert.equal(buildDefaultBatchArchivePath(), "/downloads/cet6-papers.zip");
});

test("默认全选批量下载整包 zip 在本地资源中真实存在", async () => {
  await access(resolve(rootDir, "public", buildDefaultBatchArchivePath().replace(/^\//, "")));
});

test("移动端分页预览会生成稳定的页面图片路径", () => {
  assert.equal(
    buildPaperPreviewPagePath(2025, 12, 1, 3),
    "/previews/2025/12/cet6-2025-12-set-01-pages/page-03.jpg"
  );
  assert.equal(
    buildPaperPreviewPagePath(2024, 6, 2, 11),
    "/previews/2024/06/cet6-2024-06-set-02-pages/page-11.jpg"
  );
});

test("移动端分页预览首张图在本地资源中真实存在", async () => {
  for (const paper of papers) {
    await access(
      resolve(rootDir, "public", buildPaperPreviewPagePath(paper.year, paper.month, paper.setNumber, 1).replace(/^\//, ""))
    );
  }
});

test("新增真题记录会按年份倒序、月份倒序、套数正序排序", () => {
  const sorted = sortPapers([
    {
      id: "cet6-2025-06-set-03",
      year: 2025,
      month: 6,
      setNumber: 3,
      title: "2025年6月英语六级真题(第3套)",
      pdfPath: "/papers/2025/06/cet6-2025-06-set-03.pdf"
    },
    {
      id: "cet6-2026-12-set-02",
      year: 2026,
      month: 12,
      setNumber: 2,
      title: "2026年12月英语六级真题(第2套)",
      pdfPath: "/papers/2026/12/cet6-2026-12-set-02.pdf"
    },
    {
      id: "cet6-2026-12-set-01",
      year: 2026,
      month: 12,
      setNumber: 1,
      title: "2026年12月英语六级真题(第1套)",
      pdfPath: "/papers/2026/12/cet6-2026-12-set-01.pdf"
    },
    {
      id: "cet6-2025-12-set-01",
      year: 2025,
      month: 12,
      setNumber: 1,
      title: "2025年12月英语六级真题(第1套)",
      pdfPath: "/papers/2025/12/cet6-2025-12-set-01.pdf"
    }
  ]);

  assert.deepEqual(
    sorted.map((paper) => paper.id),
    ["cet6-2026-12-set-01", "cet6-2026-12-set-02", "cet6-2025-12-set-01", "cet6-2025-06-set-03"]
  );
});

test("批量导入一个半年时会生成 3 套标准资源计划", () => {
  const plan = buildSessionAssetPlan(2026, 12);

  assert.equal(plan.length, 3);
  assert.deepEqual(
    plan.map((item) => item.id),
    ["cet6-2026-12-set-01", "cet6-2026-12-set-02", "cet6-2026-12-set-03"]
  );
  assert.deepEqual(
    plan.map((item) => item.pdfPath),
    [
      "/papers/2026/12/cet6-2026-12-set-01.pdf",
      "/papers/2026/12/cet6-2026-12-set-02.pdf",
      "/papers/2026/12/cet6-2026-12-set-03.pdf"
    ]
  );
});

test("可以生成写入数据文件的标准记录片段", () => {
  assert.equal(
    buildPaperRecordSnippet(2026, 6, 2),
    `  {\n    ...buildPaperAssetPaths(2026, 6, 2),\n    year: 2026,\n    month: 6,\n    setNumber: 2\n  }`
  );
});

test("批量导入后可以把 3 条记录插入 papers 数组", () => {
  const original = `export const papers: Cet6Paper[] = [\n  {\n    ...buildPaperAssetPaths(2025, 12, 1),\n    year: 2025,\n    month: 12,\n    setNumber: 1\n  }\n];\n`;

  const updated = insertPaperRecords(original, [
    buildPaperRecordSnippet(2026, 6, 1),
    buildPaperRecordSnippet(2026, 6, 2),
    buildPaperRecordSnippet(2026, 6, 3)
  ]);

  assert.match(updated, /\.\.\.buildPaperAssetPaths\(2025, 12, 1\)/);
  assert.match(updated, /\.\.\.buildPaperAssetPaths\(2026, 6, 1\)/);
  assert.match(updated, /\.\.\.buildPaperAssetPaths\(2026, 6, 2\)/);
  assert.match(updated, /\.\.\.buildPaperAssetPaths\(2026, 6, 3\)/);
});

test("插入记录时不会误命中函数内部的 marker 字符串", () => {
  const original = [
    'export function insertPaperRecords(source: string) {',
    '  const marker = "export const papers: Cet6Paper[] = [";',
    "  return source;",
    "}",
    "",
    "export const papers: Cet6Paper[] = [",
    "  {",
    "    ...buildPaperAssetPaths(2025, 12, 1),",
    "    year: 2025,",
    "    month: 12,",
    "    setNumber: 1",
    "  }",
    "];",
    ""
  ].join("\n");

  const updated = insertPaperRecords(original, [buildPaperRecordSnippet(2026, 6, 1)]);

  assert.match(updated, /const marker = "export const papers: Cet6Paper\[] = \[";/);
  assert.match(updated, /\.\.\.buildPaperAssetPaths\(2026, 6, 1\)/);
});

test("重复插入同一条记录时会直接报错", () => {
  const original = `export const papers: Cet6Paper[] = [\n  {\n    ...buildPaperAssetPaths(2026, 6, 1),\n    year: 2026,\n    month: 6,\n    setNumber: 1\n  }\n];\n`;

  assert.throws(
    () => insertPaperRecords(original, [buildPaperRecordSnippet(2026, 6, 1)]),
    /已存在/
  );
});

test("prepare:session 可以识别 --verify 开关", () => {
  const parsed = parsePrepareSessionArgs([
    "2026",
    "12",
    "/tmp/set-1.pdf",
    "/tmp/set-2.pdf",
    "/tmp/set-3.pdf",
    "--verify"
  ]);

  assert.equal(parsed.year, 2026);
  assert.equal(parsed.month, 12);
  assert.deepEqual(parsed.sourcePdfs, ["/tmp/set-1.pdf", "/tmp/set-2.pdf", "/tmp/set-3.pdf"]);
  assert.equal(parsed.verifyAfterImport, true);
});

test("prepare:session 默认不开启导入后自动校验", () => {
  const parsed = parsePrepareSessionArgs([
    "2026",
    "6",
    "/tmp/set-1.pdf",
    "/tmp/set-2.pdf",
    "/tmp/set-3.pdf"
  ]);

  assert.equal(parsed.verifyAfterImport, false);
});

test("每条真题记录都至少指向存在的 PDF 文件", async () => {
  for (const paper of papers) {
    await access(resolve(rootDir, "public", paper.pdfPath.replace(/^\//, "")));

    if (paper.previewImagePath) {
      await access(resolve(rootDir, "public", paper.previewImagePath.replace(/^\//, "")));
    }

    if (paper.audioPath) {
      await access(resolve(rootDir, "public", paper.audioPath.replace(/^\//, "")));
    }
  }
});
