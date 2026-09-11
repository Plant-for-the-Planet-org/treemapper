/**
 * Canopy geometry shared by every drawn map on the product page.
 *
 * `tmClump` is one blob of tree crowns; `tmForest` and `tmScrub` are the hero's
 * scatter of them. Sections pull them in with `<use href="#tmClump" />`, which
 * resolves against the whole document, so this must be rendered exactly once
 * near the top of the page.
 */
export function CanopySprite() {
  return (
    <svg width="0" height="0" aria-hidden="true" className="absolute" focusable="false">
      <defs>
        <g id="tmClump">
          <circle cx="0" cy="0" r="19" />
          <circle cx="17" cy="-7" r="14" />
          <circle cx="32" cy="4" r="17" />
          <circle cx="13" cy="13" r="14" />
          <circle cx="-15" cy="9" r="13" />
          <circle cx="3" cy="-15" r="12" />
        </g>
        <g id="tmForest">
          <use href="#tmClump" transform="translate(96,148) scale(1.4)" />
          <use href="#tmClump" transform="translate(224,104) scale(1.15)" />
          <use href="#tmClump" transform="translate(330,166) scale(1.32)" />
          <use href="#tmClump" transform="translate(58,268) scale(1.22)" />
          <use href="#tmClump" transform="translate(196,244) scale(1.34)" />
          <use href="#tmClump" transform="translate(308,306) scale(1.1)" />
          <use href="#tmClump" transform="translate(424,232) scale(1.24)" />
          <use href="#tmClump" transform="translate(474,120) scale(1.02)" />
          <use href="#tmClump" transform="translate(132,378) scale(1.14)" />
          <use href="#tmClump" transform="translate(262,398) scale(1)" />
          <use href="#tmClump" transform="translate(384,364) scale(.94)" />
          <use href="#tmClump" transform="translate(556,190) scale(.9)" />
          <use href="#tmClump" transform="translate(638,104) scale(1)" />
          <use href="#tmClump" transform="translate(744,158) scale(.86)" />
          <use href="#tmClump" transform="translate(500,320) scale(.78)" />
          <use href="#tmClump" transform="translate(620,300) scale(.7)" />
          <use href="#tmClump" transform="translate(736,262) scale(.64)" />
          <use href="#tmClump" transform="translate(826,112) scale(.68)" />
          <use href="#tmClump" transform="translate(48,56) scale(.88)" />
          <use href="#tmClump" transform="translate(360,58) scale(.8)" />
          <use href="#tmClump" transform="translate(180,58) scale(.7)" />
        </g>
        <g id="tmScrub">
          <use href="#tmClump" transform="translate(556,404) scale(.5)" />
          <use href="#tmClump" transform="translate(646,382) scale(.44)" />
          <use href="#tmClump" transform="translate(722,412) scale(.4)" />
          <use href="#tmClump" transform="translate(806,374) scale(.46)" />
        </g>
      </defs>
    </svg>
  );
}
