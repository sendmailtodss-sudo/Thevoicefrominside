/* Coordinates in one 222 × 444 atlas cell, shared by shop and landing. */
globalThis.SFICreatorPrintPlacement = index => ({
  center: [115,115,113,108,98,93,90,96][index],
  top: index === 7 ? 162 : index === 5 ? 132 : 104,
  height: index === 7 ? 20 : index === 5 ? 30 : 50,
  width: 54,
});
