// Generates a .docx file entirely in the browser from the same structured CV
// JSON the on-screen templates render. Deliberately a single clean,
// single-column layout regardless of which visual template is selected —
// many applicant tracking systems parse multi-column résumés incorrectly,
// so a single-column Word export is the safer choice for something that
// might get fed into a company's ATS rather than read by a human directly.
export async function generateCvDocx(cv) {
  const {
    Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle,
  } = await import("docx");

  const c = cv.contact || {};
  const contactLine = [c.email, c.phone, c.location, c.linkedin].filter(Boolean).join("   |   ");

  const sectionHeading = (text) =>
    new Paragraph({
      spacing: { before: 260, after: 100 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "999999" } },
      children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 20, color: "0B7A3B" })],
    });

  const children = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: cv.name || "", bold: true, size: 40 })],
    }),
    ...(cv.title
      ? [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: cv.title, size: 24 })] })]
      : []),
    ...(contactLine
      ? [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text: contactLine, size: 18, color: "444444" })] })]
      : []),
  ];

  if (cv.summary) {
    children.push(sectionHeading("Profile"));
    children.push(new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: cv.summary, size: 21 })] }));
  }

  if (cv.experience?.length) {
    children.push(sectionHeading("Experience"));
    for (const e of cv.experience) {
      children.push(
        new Paragraph({
          spacing: { before: 140, after: 20 },
          children: [
            new TextRun({ text: `${e.role || ""}, ${e.company || ""}`, bold: true, size: 21 }),
            new TextRun({ text: e.dates ? `    ${e.dates}` : "", size: 19, color: "666666", italics: true }),
          ],
        })
      );
      for (const b of e.bullets || []) {
        children.push(
          new Paragraph({ bullet: { level: 0 }, spacing: { after: 20 }, children: [new TextRun({ text: b, size: 20 })] })
        );
      }
    }
  }

  if (cv.skills?.length) {
    children.push(sectionHeading("Skills"));
    children.push(new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: cv.skills.join("  •  "), size: 21 })] }));
  }

  if (cv.education?.length) {
    children.push(sectionHeading("Education"));
    for (const e of cv.education) {
      children.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({ text: `${e.degree || ""}, ${e.school || ""}`, bold: true, size: 21 }),
            new TextRun({ text: e.dates ? `    ${e.dates}` : "", size: 19, color: "666666", italics: true }),
          ],
        })
      );
    }
  }

  if (cv.certifications?.length) {
    children.push(sectionHeading("Certifications"));
    children.push(new Paragraph({ children: [new TextRun({ text: cv.certifications.join("  •  "), size: 21 })] }));
  }

  const doc = new Document({
    sections: [{ properties: { page: { margin: { top: 720, bottom: 720, left: 900, right: 900 } } }, children }],
  });

  return Packer.toBlob(doc);
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
