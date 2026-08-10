// Decorative flat-vector restoration scene: layered hills with saplings.
// Purely ambient, hidden from assistive tech.

type PlantationSceneProps = {
  className?: string;
};

// A single stylised tree placed on the hillside.
const Tree = ({ x, y, scale = 1, tone = "#1F7A4D" }: { x: number; y: number; scale?: number; tone?: string }) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <rect x="-3" y="14" width="6" height="22" rx="3" fill="#6B4A33" />
    <path d="M0 -28 L22 18 L-22 18 Z" fill={tone} />
    <path d="M0 -14 L17 22 L-17 22 Z" fill={tone} opacity="0.82" />
  </g>
);

// A young sprout for the foreground.
const Sprout = ({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <path d="M0 18 L0 -2" stroke="#3F8F60" strokeWidth="3" strokeLinecap="round" />
    <path d="M0 4 C -14 4 -16 -10 -16 -10 C -4 -10 0 -2 0 4 Z" fill="#36A06A" />
    <path d="M0 1 C 14 1 16 -14 16 -14 C 4 -14 0 -6 0 1 Z" fill="#2E8B57" />
  </g>
);

export const PlantationScene: React.FC<PlantationSceneProps> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 1200 260"
    preserveAspectRatio="xMidYMax slice"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* soft sun */}
    <circle cx="1010" cy="74" r="52" fill="#FFE6A6" opacity="0.55" />

    {/* back hill */}
    <path
      d="M0 158 C 220 104 380 138 600 124 C 820 110 1000 96 1200 134 L1200 260 L0 260 Z"
      fill="#CBE9D6"
    />
    {/* mid hill */}
    <path
      d="M0 194 C 260 146 460 182 720 166 C 940 153 1080 156 1200 184 L1200 260 L0 260 Z"
      fill="#A2DBB8"
    />

    {/* trees on the mid ridge */}
    <Tree x={210} y={150} scale={1.05} tone="#2E8B57" />
    <Tree x={300} y={166} scale={0.78} tone="#3FA76B" />
    <Tree x={980} y={150} scale={0.95} tone="#2E8B57" />

    {/* front hill */}
    <path
      d="M0 224 C 300 198 600 220 900 208 C 1050 202 1140 210 1200 212 L1200 260 L0 260 Z"
      fill="#76C796"
    />

    {/* foreground planting */}
    <Tree x={620} y={210} scale={1.15} tone="#1F7A4D" />
    <Sprout x={500} y={224} scale={1.1} />
    <Sprout x={720} y={228} scale={0.9} />
    <Sprout x={1080} y={222} scale={1.05} />
  </svg>
);
