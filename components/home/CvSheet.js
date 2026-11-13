"use client";
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
