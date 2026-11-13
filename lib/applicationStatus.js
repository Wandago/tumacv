// Where an application is at. Stored in generations.result.tracking.status.
// `color` is the Token colour used for it in the tracker.
export const APPLICATION_STATUSES = [
  { value: "tailored", label: "Tailored", color: "purple" },
  { value: "applied", label: "Applied", color: "blue" },
  { value: "interview", label: "Interview", color: "yellow" },
  { value: "offer", label: "Offer", color: "green" },
  { value: "rejected", label: "Not this time", color: "gray" },
];

export const statusOf = (generation) =>
  APPLICATION_STATUSES.find((s) => s.value === generation?.result?.tracking?.status) || null;
