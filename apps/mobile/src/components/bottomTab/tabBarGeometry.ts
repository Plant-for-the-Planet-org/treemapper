/**
 * Every number the bottom tab bar draws comes from this one file.
 *
 * The bar is a white shape with rounded top corners and a circular bite taken
 * out of its top edge, and the "+" button sits in that bite with its centre on
 * the bar's top edge. The bite is a little wider than the button, so a ring of
 * map shows between the two. Bite and button have to agree to the pixel on any
 * screen, so they are derived together here rather than guessed twice in two
 * components.
 *
 * Sizes scale with window width against a 360dp base -- the same base the
 * repo's `scaleSize` uses -- but every one of them is clamped. A narrow phone
 * gets a slightly smaller icon, a tablet or a landscape phone stops growing
 * well before it reaches the `windowWidth / 5.5` button that used to be here.
 * Nothing is a bare fraction of the screen.
 */

/** Window width the sizes below are drawn at 1:1. */
const BASE_WIDTH = 360

/** Icon + label row at base width, before the safe-area inset. */
const BASE_CONTENT_HEIGHT = 64
const BASE_CORNER_RADIUS = 12
const BASE_ICON_SIZE = 26
const BASE_LABEL_FONT_SIZE = 12
const BASE_FAB_DIAMETER = 64

const ICON_SIZE_RANGE: Range = [22, 30]
const LABEL_FONT_SIZE_RANGE: Range = [11, 14]
const FAB_DIAMETER_RANGE: Range = [56, 72]
const CORNER_RADIUS_RANGE: Range = [10, 16]

/** Gap between the icon and its label. */
const LABEL_GAP = 4
/** Breathing room above the icon and below the label. */
const CONTENT_PADDING_V = 8
/** A label's box is a bit taller than its font size. */
const LABEL_LINE_RATIO = 1.3
/** The "+" glyph inside the floating button. */
const FAB_GLYPH_RATIO = 0.47

/** Transparent ring left between the button and the edge of the bite. */
const FAB_NOTCH_GAP = 7
/** Keeps the whole bite on screen on a narrow phone. */
const FAB_EDGE_MARGIN = 6
/** Room above the button so its shadow is not clipped. */
const FAB_SHADOW_HEADROOM = 6

type Range = [min: number, max: number]

export interface TabBarGeometry {
  /** Full bar width. */
  width: number
  tabCount: number
  tabWidth: number
  /** Height of the whole touchable container, button overhang included. */
  containerHeight: number
  /** Top edge of the white bar, measured from the top of the container. */
  barTop: number
  /**
   * How far the button had to be nudged off its tab's centre to keep it clear
   * of the bar's right corner. Zero on anything wider than ~340dp; the
   * "Add" label shifts by the same amount so it stays under the button.
   */
  addLabelOffset: number
  /** Height of the white bar, safe-area inset included. */
  barHeight: number
  bottomInset: number
  cornerRadius: number
  /** Square box each tab icon is drawn in. */
  iconSize: number
  labelFontSize: number
  labelGap: number
  fabDiameter: number
  fabRadius: number
  /** The "+" glyph, sized off the button it sits in. */
  fabGlyphSize: number
  /** Radius of the bite: button radius plus the transparent ring. */
  notchRadius: number
  fabCenterX: number
  fabCenterY: number
  fabLeft: number
  fabTop: number
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

/** Two decimals is plenty for an SVG path and keeps the string short. */
const round = (value: number) => Math.round(value * 100) / 100

interface GeometryInput {
  width: number
  bottomInset?: number
  tabCount?: number
  /**
   * The OS text size setting, from `useWindowDimensions().fontScale`. React
   * Native already multiplies `fontSize` by it when it draws the label, so it
   * is never applied to the font size here -- it is only used to work out how
   * tall the bar has to be so a large setting does not clip.
   */
  fontScale?: number
}

export function getTabBarGeometry({
  width,
  bottomInset = 0,
  tabCount = 4,
  fontScale = 1,
}: GeometryInput): TabBarGeometry {
  const safeWidth = Math.max(width, 1)
  const safeTabCount = Math.max(tabCount, 1)
  const tabWidth = safeWidth / safeTabCount
  const inset = Math.max(bottomInset, 0)

  // One ratio drives every size below, so icon, label and button grow and
  // stop together instead of one of them scaling while the others do not.
  const ratio = safeWidth / BASE_WIDTH
  const scale = (base: number, [min, max]: Range) =>
    Math.round(clamp(base * ratio, min, max))

  const iconSize = scale(BASE_ICON_SIZE, ICON_SIZE_RANGE)
  const labelFontSize = scale(BASE_LABEL_FONT_SIZE, LABEL_FONT_SIZE_RANGE)
  const fabDiameter = scale(BASE_FAB_DIAMETER, FAB_DIAMETER_RANGE)

  const fabRadius = fabDiameter / 2
  const notchRadius = fabRadius + FAB_NOTCH_GAP

  // Tall enough for what it actually holds. A user on a large OS text size
  // gets a taller bar rather than a clipped label, and the `Math.max` keeps
  // the familiar 64dp on a stock phone where the parts already fit.
  const contentHeight = Math.max(
    Math.round(BASE_CONTENT_HEIGHT * clamp(ratio, 1, 1.15)),
    iconSize +
      LABEL_GAP +
      Math.ceil(labelFontSize * fontScale * LABEL_LINE_RATIO) +
      CONTENT_PADDING_V * 2,
  )

  const barHeight = contentHeight + inset

  // Centred on the last tab, pulled back only if the bite would otherwise run
  // off the screen. That is nil on every size in use; the button staying on
  // its tab's centre, under its label, matters more than the corner below.
  const lastTabCenterX = tabWidth * (safeTabCount - 0.5)
  const fabCenterX = clamp(
    lastTabCenterX,
    notchRadius + FAB_EDGE_MARGIN,
    safeWidth - notchRadius - FAB_EDGE_MARGIN,
  )

  // The bite sits close to the bar's right corner, and the two cannot share
  // the same stretch of top edge: a corner that started before the bite ended
  // would draw the edge backwards. So the corner gives way, down to square if
  // it has to. Both corners use the value so the bar stays symmetrical.
  const cornerRadius = round(
    Math.max(
      0,
      Math.min(
        scale(BASE_CORNER_RADIUS, CORNER_RADIUS_RANGE),
        safeWidth / 2,
        barHeight / 2,
        safeWidth - fabCenterX - notchRadius,
        fabCenterX - notchRadius,
      ),
    ),
  )

  // Half the button stands above the bar, so the bar starts one button radius
  // (plus shadow room) below the top of the container. That keeps the button
  // inside the container, so the tab bar needs no negative offsets and
  // nothing is drawn outside its parent.
  const barTop = fabRadius + FAB_SHADOW_HEADROOM
  const containerHeight = barTop + barHeight
  const fabCenterY = barTop

  return {
    width: round(safeWidth),
    tabCount: safeTabCount,
    tabWidth: round(tabWidth),
    containerHeight: round(containerHeight),
    barTop: round(barTop),
    addLabelOffset: round(fabCenterX - lastTabCenterX),
    barHeight: round(barHeight),
    bottomInset: inset,
    cornerRadius,
    iconSize,
    labelFontSize,
    labelGap: LABEL_GAP,
    fabDiameter: round(fabDiameter),
    fabRadius: round(fabRadius),
    fabGlyphSize: Math.round(fabDiameter * FAB_GLYPH_RATIO),
    notchRadius: round(notchRadius),
    fabCenterX: round(fabCenterX),
    fabCenterY: round(fabCenterY),
    fabLeft: round(fabCenterX - fabRadius),
    fabTop: round(barTop - fabRadius),
  }
}

/**
 * One subpath: the bar, with the bite cut into its top edge.
 *
 * The bite is half a circle, dipping down into the bar from the top edge --
 * not a whole circle. A whole one was the bug this replaced: as a second
 * subpath under `fillRule="evenodd"` it read as a hole only where it
 * overlapped the bar, while the half above the top edge lay inside a single
 * subpath and painted as a white disc standing over the map.
 *
 * Because the cut stops at the top edge, everything above it is map, and the
 * only white there is the button itself.
 */
export function buildTabBarPath(geometry: TabBarGeometry): string {
  const {
    width,
    barTop,
    containerHeight,
    cornerRadius: r,
    fabCenterX: cx,
    notchRadius: nr,
  } = geometry

  return [
    `M 0 ${round(barTop + r)}`,
    `A ${r} ${r} 0 0 1 ${r} ${barTop}`,
    `H ${round(cx - nr)}`,
    // sweep 0 bends the arc towards +y, so the bite dips into the bar
    // instead of arching over it.
    `A ${nr} ${nr} 0 0 0 ${round(cx + nr)} ${barTop}`,
    `H ${round(width - r)}`,
    `A ${r} ${r} 0 0 1 ${width} ${round(barTop + r)}`,
    `V ${containerHeight}`,
    `H 0`,
    'Z',
  ].join(' ')
}
