// The CV designs components/CvView.js can render. The CV content is the same
// for all of them, so switching design never needs a new generation.
//
// `layout` picks the structure; the look of each design lives in app/cv.css
// under `.cv.<id>`. `swatch` is the design's accent, shown in pickers.
export const TEMPLATES = [
  { id: "nairobi", name: "Nairobi", layout: "split", swatch: "#1F2A44", desc: "Modern two-column with a navy accent. Most roles." },
  { id: "atlas", name: "Atlas", layout: "sidebar", swatch: "#2E4A7D", desc: "Soft sidebar, timeline experience. Tech, media, NGOs." },
  { id: "savannah", name: "Savannah", layout: "labelled", swatch: "#B4532A", desc: "Editorial serif, terracotta details. Creative, comms." },
  { id: "kilimani", name: "Kilimani", layout: "single", swatch: "#4A1F55", desc: "Bold plum header band. Stand out in a stack." },
  { id: "ivory", name: "Ivory", layout: "single", swatch: "#1A1A1A", desc: "Classic serif, centred. Banks, government, law." },
  { id: "swift", name: "Swift", layout: "single", swatch: "#333333", desc: "Dense and ATS-friendly. Lots of experience." },
  { id: "campus", name: "Campus", layout: "single", swatch: "#C2453E", desc: "Education first, skill chips. Graduates, interns." },
  { id: "boardroom", name: "Boardroom", layout: "single", swatch: "#26303B", desc: "Formal, spaced capitals. Senior and leadership." },
];

// Applications saved before the redesign used these ids.
const LEGACY = { classic: "ivory", modern: "atlas", compact: "swift", minimal: "savannah", executive: "boardroom" };

export const DEFAULT_TEMPLATE = "nairobi";

export function resolveTemplate(id) {
  if (TEMPLATES.some((t) => t.id === id)) return id;
  return LEGACY[id] || DEFAULT_TEMPLATE;
}

export const templateById = (id) => TEMPLATES.find((t) => t.id === resolveTemplate(id));
