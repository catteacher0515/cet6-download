import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

test.before(() => {
  execSync("npm run build", { stdio: "pipe" });
});

test("首页和关于页会出现在构建产物中", () => {
  const homeHtml = readFileSync(resolve(process.cwd(), "dist/index.html"), "utf8");
  const aboutHtml = readFileSync(resolve(process.cwd(), "dist/about/index.html"), "utf8");

  assert.match(homeHtml, /六级真题资料站/);
  assert.match(homeHtml, /href="\/cet6-download\/papers"/);
  assert.match(homeHtml, /六级真题/);
  assert.match(homeHtml, /直接下载/);
  assert.match(homeHtml, /进入真题下载页/);
  assert.match(aboutHtml, /关于本站/);
  assert.match(aboutHtml, /这个站会持续维护什么/);
  assert.match(aboutHtml, /这个站适合谁/);
  assert.match(aboutHtml, /如果你想第一时间拿到新真题更新，可以在小红书关注萍雨/);
  assert.doesNotMatch(aboutHtml, /把资料更直接地交给你/);
  assert.doesNotMatch(aboutHtml, /更新同步/);
});

test("真题下载页输出年份分组和 PDF 下载链接", () => {
  const papersHtml = readFileSync(resolve(process.cwd(), "dist/papers/index.html"), "utf8");

  assert.match(papersHtml, /site-shell--full-bleed/);
  assert.match(papersHtml, /papers-hero papers-hero--compact page-section/);
  assert.match(papersHtml, /papers-session papers-session--compact/);
  assert.match(papersHtml, /papers-grid papers-grid--three-up/);
  assert.match(papersHtml, /papers-section__head papers-section__head--center/);
  assert.match(papersHtml, /2025年 - 下半年/);
  assert.match(papersHtml, /2025年12月英语六级真题\(第1套\)/);
  assert.match(papersHtml, /2025年12月英语六级真题\(第2套\)/);
  assert.match(papersHtml, /2025年12月英语六级真题\(第3套\)/);
  assert.match(papersHtml, /下载 PDF/);
  assert.match(papersHtml, /批量下载/);
  assert.match(papersHtml, /批量下载真题/);
  assert.match(papersHtml, /开始下载/);
  assert.match(papersHtml, /全选全部真题/);
  assert.match(papersHtml, /\/cet6-download\/downloads\/cet6-papers\.zip/);
  assert.match(papersHtml, /\/cet6-download\/papers\/2025\/12\/cet6-2025-12-set-01\.pdf/);
  assert.match(papersHtml, /\/cet6-download\/papers\/2025\/12\/1\//);
  assert.doesNotMatch(papersHtml, /Coming Soon/);
});

test("试卷预览页输出在线预览和下载入口", () => {
  const previewHtml = readFileSync(resolve(process.cwd(), "dist/papers/2025/12/1/index.html"), "utf8");

  assert.match(previewHtml, /2025年12月英语六级真题\(第1套\)/);
  assert.match(previewHtml, /reader-pdfjs/);
  assert.match(previewHtml, /reader-mobile-preview/);
  assert.match(previewHtml, /reader-mobile-preview__page/);
  assert.match(previewHtml, /href="\/cet6-download\/papers"/);
  assert.match(previewHtml, /data-pdf-url="\/cet6-download\/papers\/2025\/12\/cet6-2025-12-set-01\.pdf"/);
  assert.match(previewHtml, /data-mobile-preview-root/);
  assert.match(previewHtml, /page-01\.jpg/);
  assert.doesNotMatch(previewHtml, /reader-topbar/);
  assert.match(previewHtml, /reader-audio-bar/);
  assert.match(previewHtml, /reader-audio-bar__toggle/);
  assert.match(previewHtml, /reader-audio-bar__seek/);
  assert.match(previewHtml, /reader-audio-bar__time-current/);
  assert.doesNotMatch(previewHtml, /iframe/);
  assert.match(previewHtml, /听力音频/);
  assert.match(previewHtml, /audio/);
  assert.match(previewHtml, /\/cet6-download\/audio\/2025\/12\/cet6-2025-12-set-01\.mp3/);
});

test("首页会强调真题下载与后续高频词汇扩展方向", () => {
  const homeHtml = readFileSync(resolve(process.cwd(), "dist/index.html"), "utf8");

  assert.match(homeHtml, /最近更新/);
  assert.match(homeHtml, /查看最新真题/);
  assert.doesNotMatch(homeHtml, /站点承诺/);
  assert.doesNotMatch(homeHtml, /最新真题预览/);
  assert.doesNotMatch(homeHtml, /不登录，不跳网盘，直接提供真题 PDF，后续再逐步补齐对应听力音频/);
});
