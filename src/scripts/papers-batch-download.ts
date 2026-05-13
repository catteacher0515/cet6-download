import JSZip from "jszip";

type BatchDownloadPaper = {
  id: string;
  title: string;
  pdfPath: string;
  sessionLabel: string;
  batchFilename: string;
};

type BatchDownloadState = {
  dialog: HTMLDialogElement;
  openButtons: HTMLElement[];
  closeButtons: HTMLElement[];
  startButton: HTMLButtonElement;
  selectAll: HTMLInputElement;
  checkboxes: HTMLInputElement[];
  summary: HTMLElement | null;
  status: HTMLElement | null;
  papersById: Map<string, BatchDownloadPaper>;
  defaultArchivePath: string | null;
};

function readPapers(): BatchDownloadPaper[] {
  const dataNode = document.getElementById("papers-batch-download-data");

  if (!dataNode?.textContent) {
    return [];
  }

  try {
    return JSON.parse(dataNode.textContent) as BatchDownloadPaper[];
  } catch (error) {
    console.error("批量下载数据解析失败", error);
    return [];
  }
}

function readDefaultArchivePath() {
  const dataNode = document.getElementById("papers-batch-download-default-archive");

  if (!dataNode?.textContent) {
    return null;
  }

  try {
    return JSON.parse(dataNode.textContent) as string;
  } catch (error) {
    console.error("批量下载整包路径解析失败", error);
    return null;
  }
}

function updateSummary(state: BatchDownloadState) {
  const selectedCount = state.checkboxes.filter((checkbox) => checkbox.checked).length;

  if (state.summary) {
    state.summary.textContent = `已选 ${selectedCount} 套真题`;
  }

  state.selectAll.checked = selectedCount === state.checkboxes.length;
  state.selectAll.indeterminate = selectedCount > 0 && selectedCount < state.checkboxes.length;
  state.startButton.disabled = selectedCount === 0;

  if (selectedCount === 0 && state.status?.textContent === "") {
    state.status.textContent = "请至少选择 1 套真题。";
  }
}

function setStatus(state: BatchDownloadState, message: string) {
  if (state.status) {
    state.status.textContent = message;
  }
}

function triggerZipDownload(urlOrBlob: string | Blob) {
  if (typeof urlOrBlob === "string") {
    // 移动端对 download 属性和脚本点击的兼容性较差，直接跳转更稳定。
    window.location.assign(urlOrBlob);
    return;
  }

  const url = URL.createObjectURL(urlOrBlob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "cet6-papers.zip";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  if (typeof urlOrBlob !== "string") {
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

async function fetchPaperBlob(paper: BatchDownloadPaper) {
  const response = await fetch(paper.pdfPath);

  if (!response.ok) {
    throw new Error(`下载失败: ${paper.batchFilename}`);
  }

  return response.blob();
}

async function startBatchDownload(state: BatchDownloadState) {
  const selectedPapers = state.checkboxes
    .filter((checkbox) => checkbox.checked)
    .map((checkbox) => state.papersById.get(checkbox.value))
    .filter((paper): paper is BatchDownloadPaper => Boolean(paper));

  if (selectedPapers.length === 0) {
    setStatus(state, "请至少选择 1 套真题。");
    updateSummary(state);
    return;
  }

  state.startButton.disabled = true;
  state.selectAll.disabled = true;
  state.checkboxes.forEach((checkbox) => {
    checkbox.disabled = true;
  });

  try {
    const isDefaultFullSelection = selectedPapers.length === state.checkboxes.length && state.defaultArchivePath;

    if (isDefaultFullSelection) {
      setStatus(state, "正在进入整包下载...");

      window.setTimeout(() => {
        triggerZipDownload(state.defaultArchivePath as string);
      }, 80);

      return;
    }

    const zip = new JSZip();

    for (let index = 0; index < selectedPapers.length; index += 1) {
      const paper = selectedPapers[index];
      setStatus(state, `正在打包 ${index + 1} / ${selectedPapers.length} · ${paper.batchFilename}`);
      const blob = await fetchPaperBlob(paper);
      zip.file(paper.batchFilename, blob);
    }

    setStatus(state, "正在生成 zip 包...");
    const zipBlob = await zip.generateAsync({ type: "blob" });
    triggerZipDownload(zipBlob);
    setStatus(state, `已开始下载，共 ${selectedPapers.length} 套真题。`);
    state.dialog.close();
  } catch (error) {
    console.error(error);
    setStatus(state, "打包失败，请稍后重试。");
  } finally {
    state.selectAll.disabled = false;
    state.checkboxes.forEach((checkbox) => {
      checkbox.disabled = false;
    });
    updateSummary(state);
    if (state.checkboxes.some((checkbox) => checkbox.checked)) {
      state.startButton.disabled = false;
    }
  }
}

function initBatchDownload() {
  const dialog = document.querySelector<HTMLDialogElement>("[data-batch-download-dialog]");
  const selectAll = document.querySelector<HTMLInputElement>("[data-batch-download-select-all]");
  const startButton = document.querySelector<HTMLButtonElement>("[data-batch-download-start]");

  if (!dialog || !selectAll || !startButton) {
    return;
  }

  const papers = readPapers();
  const state: BatchDownloadState = {
    dialog,
    openButtons: Array.from(document.querySelectorAll<HTMLElement>("[data-batch-download-open]")),
    closeButtons: Array.from(document.querySelectorAll<HTMLElement>("[data-batch-download-close]")),
    startButton,
    selectAll,
    checkboxes: Array.from(document.querySelectorAll<HTMLInputElement>("[data-batch-download-item]")),
    summary: document.querySelector<HTMLElement>("[data-batch-download-summary]"),
    status: document.querySelector<HTMLElement>("[data-batch-download-status]"),
    papersById: new Map(papers.map((paper) => [paper.id, paper])),
    defaultArchivePath: readDefaultArchivePath()
  };

  state.openButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setStatus(state, "");
      dialog.showModal();
    });
  });

  state.closeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      dialog.close();
    });
  });

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });

  selectAll.addEventListener("change", () => {
    state.checkboxes.forEach((checkbox) => {
      checkbox.checked = selectAll.checked;
    });
    setStatus(state, "");
    updateSummary(state);
  });

  state.checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      setStatus(state, "");
      updateSummary(state);
    });
  });

  startButton.addEventListener("click", () => {
    void startBatchDownload(state);
  });

  updateSummary(state);
}

initBatchDownload();
