"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Text } from "@astryxdesign/core/Text";
import CvView from "../CvView";

// The printable "paper" a CV or cover letter is shown on. This is the
// product's output — a document that prints and saves as PDF — so it keeps
// its own print-ready styling (app/app.css: .sheet, .letter, .cv) rather
// than app-UI components.
export default function CvSheet({ children }) {
  return <article className="sheet">{children}</article>;
}

CvSheet.Cv = function SheetCv({ data, template }) {
  return <CvView data={data} template={template} />;
};

CvSheet.Letter = function SheetLetter({ text }) {
  return (
    <Text as="p" display="block" className="letter">
      {text}
    </Text>
  );
};

// A second copy of the document, mounted directly under <body> and shown
// only when printing (app/app.css hides everything else then). Printing the
// on-screen copy meant printing it inside the app shell: the page background
// printed around it, and its flex/grid/overflow ancestors could stop a
// two-page CV from flowing onto page two. Under <body> it's plain block flow
// that every browser paginates.
CvSheet.PrintCopy = function SheetPrintCopy({ children }) {
  const [root, setRoot] = useState(null);

  useEffect(() => {
    const el = document.createElement("div");
    el.className = "print-root";
    document.body.appendChild(el);
    setRoot(el);
    return () => el.remove();
  }, []);

  // The empty header and footer rows are the page's top and bottom margins:
  // browsers repeat a table's <thead>/<tfoot> on every printed page, which is
  // the one reliable way to get a margin on page two and later without a
  // CSS page margin (and a CSS page margin is where browsers print their own
  // date/title/URL header and footer).
  return root
    ? createPortal(
        <table className="print-layout" role="presentation">
          <thead><tr><td className="print-gap" /></tr></thead>
          <tfoot><tr><td className="print-gap" /></tr></tfoot>
          <tbody><tr><td><article className="sheet">{children}</article></td></tr></tbody>
        </table>,
        root
      )
    : null;
};

// Prints with the document's own name as the page title, which browsers use
// as the default PDF file name ("Jane_Wanjiku_CV.pdf", not "TumaCV — …").
export function printDocument(fileTitle) {
  const previous = document.title;
  if (fileTitle) document.title = fileTitle;
  const restore = () => {
    document.title = previous;
    window.removeEventListener("afterprint", restore);
  };
  window.addEventListener("afterprint", restore);
  window.print();
}
