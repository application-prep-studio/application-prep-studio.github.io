const MAX_FILE_BYTES = 10 * 1024 * 1024;

export type ParsedResume = {
  text: string;
  format: "DOCX" | "PDF" | "TXT";
  warning?: string;
};

function extensionOf(file: File) {
  return file.name.split(".").pop()?.toLowerCase() ?? "";
}

function cleanExtractedText(value: string) {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

export async function parseResumeFile(file: File): Promise<ParsedResume> {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("Choose a résumé file smaller than 10 MB.");
  }

  const extension = extensionOf(file);

  if (extension === "txt" || file.type === "text/plain") {
    const text = cleanExtractedText(await file.text());
    if (!text) throw new Error("This text file appears to be empty.");
    return { text, format: "TXT" };
  }

  if (
    extension === "docx" ||
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const mammoth = await import("mammoth/mammoth.browser.js");
    const result = await mammoth.extractRawText({
      arrayBuffer: await file.arrayBuffer(),
    });
    const text = cleanExtractedText(result.value);
    if (!text) throw new Error("No readable text was found in this DOCX file.");
    return {
      text,
      format: "DOCX",
      warning:
        result.messages.length > 0
          ? "Some complex Word formatting may be simplified in the editor."
          : undefined,
    };
  }

  if (extension === "pdf" || file.type === "application/pdf") {
    const pdfjs =
      typeof window === "undefined"
        ? await import("pdfjs-dist/legacy/build/pdf.mjs")
        : await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc =
      typeof window === "undefined"
        ? new URL(
            "../../node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs",
            import.meta.url,
          ).toString()
        : "/pdf.worker.min.mjs";
    const task = pdfjs.getDocument({
      data: new Uint8Array(await file.arrayBuffer()),
    });
    const pdf = await task.promise;
    const pages: string[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(
        content.items
          .map((item) => ("str" in item ? item.str : ""))
          .join(" "),
      );
    }

    const text = cleanExtractedText(pages.join("\n\n"));
    if (!text) {
      throw new Error(
        "No readable text was found. This may be a scanned PDF; try a DOCX or TXT version.",
      );
    }
    return {
      text,
      format: "PDF",
      warning:
        "PDF columns and decorative layouts can extract out of order. Review the text before exporting.",
    };
  }

  throw new Error("Use a DOCX, PDF, or TXT résumé file.");
}
