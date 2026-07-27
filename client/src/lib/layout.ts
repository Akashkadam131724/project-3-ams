/**
 * Layout class names tied to `styles/tokens.css`.
 * Prefer these over hard-coded padding utilities in shell layouts.
 */
export const layout = {
  page: "ams-page",
  pageInner: "ams-page-inner flex flex-1 flex-col",
  browserPanel: "ams-browser-panel",
  stackMd: "ams-stack-md",
  sectionGap: "ams-section-gap flex flex-col",
  cardPad: "ams-card-pad",
} as const;
