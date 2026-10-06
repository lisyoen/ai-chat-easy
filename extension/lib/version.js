// Semantic version comparison shared by background, popup and tests.
(function (root) {
  "use strict";
  function compareVersions(a, b) {
    const pa = String(a).split(".").map((x) => parseInt(x, 10) || 0);
    const pb = String(b).split(".").map((x) => parseInt(x, 10) || 0);
    for (let i = 0; i < Math.max(pa.length, pb.length, 3); i += 1) {
      const d = (pa[i] || 0) - (pb[i] || 0);
      if (d !== 0) return d > 0 ? 1 : -1;
    }
    return 0;
  }
  // True only when the published version is strictly newer than the running one.
  // Recomputed every time so a stored flag from an older install can never go stale.
  function isNewer(latest, current) {
    return !!latest && compareVersions(latest, current) > 0;
  }
  const api = { compareVersions, isNewer };
  root.AICE = Object.assign(root.AICE || {}, api);
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
