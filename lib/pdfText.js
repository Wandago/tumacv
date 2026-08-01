// Client-side PDF text extraction (pdfjs-dist). Nothing here ever touches a
// server — the file is read and parsed entirely in the browser. The worker is
// bundled locally (not loaded from a CDN) so it works even with a strict
// Content-Security-Policy and never breaks from a CDN/package version mismatch.
export async function extractPdfText(file) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf");
  const workerUrl = await import("pdfjs-dist/legacy/build/pdf.worker.min.js?url");
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl.default;
  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buf }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((it) => it.str).join(" ") + "\n\n";
  }
  return text.trim();
}
