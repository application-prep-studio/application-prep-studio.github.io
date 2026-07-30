function safeFileName(value: string) {
  return (
    value
      .trim()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "Resume"
  );
}

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function downloadResumeText(text: string, targetRole: string) {
  triggerDownload(
    new Blob([text], { type: "text/plain;charset=utf-8" }),
    `${safeFileName(targetRole || "Tailored-Resume")}.txt`,
  );
}

function isHeading(line: string) {
  const clean = line.trim().replace(/:$/, "");
  const known =
    /^(professional summary|summary|profile|core skills|skills|technical skills|competencies|experience|professional experience|work experience|employment|education|certifications?|projects?)$/i;
  return (
    known.test(clean) ||
    (clean.length > 2 &&
      clean.length < 45 &&
      clean === clean.toUpperCase() &&
      /[A-Z]/.test(clean))
  );
}

function looksLikeContact(line: string) {
  return /@|\b(?:linkedin|portfolio|github)\b|(?:\+?1[-.\s]?)?\(?\d{3}\)?|\b[A-Z]{2}\s+\d{5}\b/i.test(
    line,
  );
}

function looksLikeRoleLine(line: string) {
  return (
    line.length < 120 &&
    (/\b(?:19|20)\d{2}\b|\bpresent\b|\bcurrent\b/i.test(line) ||
      /\s[|—–]\s/.test(line))
  );
}

export async function createResumeDocxBlob(text: string) {
  const {
    AlignmentType,
    BorderStyle,
    Document,
    LevelFormat,
    LineRuleType,
    Packer,
    Paragraph,
    TextRun,
  } = await import("docx");

  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const firstContentIndex = lines.findIndex((line) => line.trim());
  let passedHeader = false;
  const paragraphs = lines.map((sourceLine, index) => {
    const line = sourceLine.trim();
    if (!line) {
      if (index > firstContentIndex + 3) passedHeader = true;
      return new Paragraph({
        spacing: { after: passedHeader ? 20 : 30 },
      });
    }

    if (index === firstContentIndex) {
      return new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 50, line: 240 },
        keepNext: true,
        children: [
          new TextRun({
            text: line,
            bold: true,
            size: 42,
            font: "Arial",
            color: "132238",
          }),
        ],
      });
    }

    if (isHeading(line)) {
      passedHeader = true;
      return new Paragraph({
        style: "ResumeSection",
        children: [
          new TextRun({
            text: line.toUpperCase(),
            bold: true,
            size: 22,
            font: "Arial",
            color: "132238",
            characterSpacing: 18,
          }),
        ],
      });
    }

    const bullet = line.match(/^(?:[-•●▪◦*])\s*(.+)$/);
    if (bullet?.[1]) {
      return new Paragraph({
        numbering: { reference: "resume-bullets", level: 0 },
        style: "ResumeBullet",
        children: [
          new TextRun({
            text: bullet[1],
            size: 21,
            font: "Arial",
            color: "1F2937",
          }),
        ],
      });
    }

    const isContactLine =
      !passedHeader &&
      index <= firstContentIndex + 4 &&
      (looksLikeContact(line) || index === firstContentIndex + 1);
    const isRoleLine = !isContactLine && looksLikeRoleLine(line);

    return new Paragraph({
      alignment: isContactLine ? AlignmentType.CENTER : AlignmentType.LEFT,
      style: isContactLine
        ? "ResumeContact"
        : isRoleLine
          ? "ResumeRole"
          : "ResumeBody",
      children: [
        new TextRun({
          text: line,
          bold: isRoleLine,
          size: isContactLine ? 18 : 21,
          font: "Arial",
          color: isContactLine ? "4B5563" : "1F2937",
        }),
      ],
    });
  });

  const document = new Document({
    creator: "",
    title: "",
    description: "",
    lastModifiedBy: "",
    revision: 1,
    styles: {
      default: {
        document: {
          run: { font: "Arial", size: 21, color: "1F2937" },
          paragraph: {
            spacing: {
              before: 0,
              after: 60,
              line: 264,
              lineRule: LineRuleType.AUTO,
            },
          },
        },
      },
      paragraphStyles: [
        {
          id: "ResumeBody",
          name: "Resume Body",
          basedOn: "Normal",
          next: "ResumeBody",
          quickFormat: true,
          run: { font: "Arial", size: 21, color: "1F2937" },
          paragraph: {
            spacing: {
              before: 0,
              after: 60,
              line: 264,
              lineRule: LineRuleType.AUTO,
            },
          },
        },
        {
          id: "ResumeContact",
          name: "Resume Contact",
          basedOn: "Normal",
          next: "ResumeContact",
          quickFormat: true,
          run: { font: "Arial", size: 18, color: "4B5563" },
          paragraph: {
            alignment: AlignmentType.CENTER,
            spacing: {
              before: 0,
              after: 30,
              line: 240,
              lineRule: LineRuleType.AUTO,
            },
            keepNext: true,
          },
        },
        {
          id: "ResumeSection",
          name: "Resume Section",
          basedOn: "Normal",
          next: "ResumeBody",
          quickFormat: true,
          run: { font: "Arial", size: 22, bold: true, color: "132238" },
          paragraph: {
            spacing: {
              before: 140,
              after: 60,
              line: 240,
              lineRule: LineRuleType.AUTO,
            },
            border: {
              bottom: {
                color: "168564",
                style: BorderStyle.SINGLE,
                size: 6,
                space: 3,
              },
            },
            keepNext: true,
            keepLines: true,
          },
        },
        {
          id: "ResumeRole",
          name: "Resume Role",
          basedOn: "Normal",
          next: "ResumeBody",
          quickFormat: true,
          run: {
            font: "Arial",
            size: 21,
            bold: true,
            color: "132238",
          },
          paragraph: {
            spacing: {
              before: 30,
              after: 40,
              line: 252,
              lineRule: LineRuleType.AUTO,
            },
            keepNext: true,
          },
        },
        {
          id: "ResumeBullet",
          name: "Resume Bullet",
          basedOn: "Normal",
          next: "ResumeBullet",
          quickFormat: true,
          run: { font: "Arial", size: 21, color: "1F2937" },
          paragraph: {
            spacing: {
              before: 0,
              after: 40,
              line: 264,
              lineRule: LineRuleType.AUTO,
            },
            indent: { left: 540, hanging: 270 },
          },
        },
      ],
    },
    numbering: {
      config: [
        {
          reference: "resume-bullets",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "•",
              alignment: AlignmentType.LEFT,
              style: {
                run: { font: "Arial", size: 21, color: "168564" },
                paragraph: {
                  indent: { left: 540, hanging: 270 },
                  spacing: {
                    before: 0,
                    after: 40,
                    line: 264,
                    lineRule: LineRuleType.AUTO,
                  },
                },
              },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 12240,
              height: 15840,
            },
            margin: {
              top: 1008,
              right: 1008,
              bottom: 1008,
              left: 1008,
              header: 432,
              footer: 432,
            },
          },
        },
        children: paragraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(document);
  return blob;
}

export async function downloadResumeDocx(text: string, targetRole: string) {
  const blob = await createResumeDocxBlob(text);
  triggerDownload(
    blob,
    `${safeFileName(targetRole || "Tailored-Resume")}.docx`,
  );
}

function pdfSafeText(value: string) {
  return value
    .replace(/[–—]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/…/g, "...")
    .replace(/\s*•\s*/g, " | ")
    .replace(/\u00a0/g, " ");
}

export type PdfFontData = {
  regular: string;
  bold: string;
};

function arrayBufferToBinaryString(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 32_768;
  let result = "";
  for (let index = 0; index < bytes.length; index += chunkSize) {
    result += String.fromCharCode(
      ...bytes.subarray(index, index + chunkSize),
    );
  }
  return result;
}

async function loadPdfFontData(): Promise<PdfFontData> {
  const [regularModule, boldModule] = await Promise.all([
    import("pdfjs-dist/standard_fonts/LiberationSans-Regular.ttf?url"),
    import("pdfjs-dist/standard_fonts/LiberationSans-Bold.ttf?url"),
  ]);
  const [regularResponse, boldResponse] = await Promise.all([
    fetch(regularModule.default),
    fetch(boldModule.default),
  ]);
  if (!regularResponse.ok || !boldResponse.ok) {
    throw new Error("The résumé fonts could not be loaded.");
  }
  const [regular, bold] = await Promise.all([
    regularResponse.arrayBuffer(),
    boldResponse.arrayBuffer(),
  ]);
  return {
    regular: arrayBufferToBinaryString(regular),
    bold: arrayBufferToBinaryString(bold),
  };
}

export async function createResumePdfBlob(
  text: string,
  targetRole = "Tailored Resume",
  suppliedFonts?: PdfFontData,
) {
  const { jsPDF } = await import("jspdf");
  const fonts = suppliedFonts ?? (await loadPdfFontData());
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "letter",
    compress: true,
    putOnlyUsedFonts: true,
  });
  pdf.addFileToVFS("LiberationSans-Regular.ttf", fonts.regular);
  pdf.addFont(
    "LiberationSans-Regular.ttf",
    "LiberationSans",
    "normal",
  );
  pdf.addFileToVFS("LiberationSans-Bold.ttf", fonts.bold);
  pdf.addFont("LiberationSans-Bold.ttf", "LiberationSans", "bold");
  pdf.setProperties({
    title: targetRole || "Tailored Resume",
    subject: "Resume",
    author: "",
    creator: "",
    keywords: "",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;
  const pageBottom = pageHeight - margin;
  const ink: [number, number, number] = [19, 34, 56];
  const body: [number, number, number] = [31, 41, 55];
  const muted: [number, number, number] = [75, 85, 99];
  const accent: [number, number, number] = [22, 133, 100];
  let y = margin;

  function addPage() {
    pdf.addPage("letter", "portrait");
    y = margin;
  }

  function ensureSpace(height: number) {
    if (y + height > pageBottom) addPage();
  }

  function wrappedLines(value: string, width: number) {
    return pdf.splitTextToSize(pdfSafeText(value), width) as string[];
  }

  function writeLines(
    lines: string[],
    x: number,
    lineHeight: number,
    after: number,
    align: "left" | "center" = "left",
  ) {
    for (const line of lines) {
      ensureSpace(lineHeight + after);
      pdf.text(line, x, y, { align });
      y += lineHeight;
    }
    y += after;
  }

  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const firstContentIndex = lines.findIndex((line) => line.trim());
  let passedHeader = false;

  lines.forEach((sourceLine, index) => {
    const line = sourceLine.trim();
    if (!line) {
      if (index > firstContentIndex + 3) passedHeader = true;
      y += passedHeader ? 3 : 4;
      return;
    }

    if (index === firstContentIndex) {
      pdf.setFont("LiberationSans", "bold");
      pdf.setFontSize(21);
      pdf.setTextColor(...ink);
      const nameLines = wrappedLines(line, contentWidth);
      ensureSpace(nameLines.length * 23 + 2);
      writeLines(nameLines, pageWidth / 2, 23, 1, "center");
      return;
    }

    if (isHeading(line)) {
      passedHeader = true;
      ensureSpace(31);
      y += 9;
      pdf.setFont("LiberationSans", "bold");
      pdf.setFontSize(11);
      pdf.setTextColor(...ink);
      pdf.text(pdfSafeText(line.toUpperCase()), margin, y);
      y += 5;
      pdf.setDrawColor(...accent);
      pdf.setLineWidth(0.8);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 10;
      return;
    }

    const bullet = line.match(/^(?:[-•●▪◦*])\s*(.+)$/);
    if (bullet?.[1]) {
      pdf.setFont("LiberationSans", "normal");
      pdf.setFontSize(10.5);
      pdf.setTextColor(...body);
      const bulletX = margin + 14;
      const bulletLines = wrappedLines(bullet[1], contentWidth - 14);
      ensureSpace(bulletLines.length * 13.5 + 3);
      pdf.setTextColor(...accent);
      pdf.text("•", margin + 1, y);
      pdf.setTextColor(...body);
      writeLines(bulletLines, bulletX, 13.5, 2);
      return;
    }

    const isContactLine =
      !passedHeader &&
      index <= firstContentIndex + 4 &&
      (looksLikeContact(line) || index === firstContentIndex + 1);
    const isRoleLine = !isContactLine && looksLikeRoleLine(line);

    if (isContactLine) {
      pdf.setFont("LiberationSans", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(...muted);
      const contactLines = wrappedLines(line, contentWidth);
      ensureSpace(contactLines.length * 11.5 + 1);
      writeLines(contactLines, pageWidth / 2, 11.5, 1, "center");
      return;
    }

    pdf.setFont("LiberationSans", isRoleLine ? "bold" : "normal");
    pdf.setFontSize(10.5);
    pdf.setTextColor(...(isRoleLine ? ink : body));
    const bodyLines = wrappedLines(line, contentWidth);
    ensureSpace(bodyLines.length * 13.5 + (isRoleLine ? 4 : 3));
    writeLines(bodyLines, margin, 13.5, isRoleLine ? 4 : 3);
  });

  return pdf.output("blob");
}

export async function downloadResumePdf(text: string, targetRole: string) {
  const blob = await createResumePdfBlob(text, targetRole);
  triggerDownload(
    blob,
    `${safeFileName(targetRole || "Tailored-Resume")}.pdf`,
  );
}
