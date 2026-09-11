const TEAMS = [
  'KTH',
  'Salesforce',
  'Yucatán Reforestation',
  'Ghana Restoration',
  'Andalusia ROS',
  'Plant-for-the-Planet',
  'Munich Urban Forestry',
  'Kilimanjaro Trust',
];

function Row({ hidden }: { hidden?: boolean }) {
  return (
    <div
      aria-hidden={hidden}
      className="flex items-center gap-14 pr-14 font-extrabold whitespace-nowrap text-tm-muted"
    >
      {TEAMS.map(team => (
        <span key={team} className="text-[22px]">
          {team}
        </span>
      ))}
    </div>
  );
}

export function TrustedBy() {
  return (
    <div className="overflow-hidden border-b border-tm-line bg-white pt-[34px] pb-[38px]">
      <div className="mb-[22px] text-center text-xs font-extrabold tracking-[1.4px] uppercase text-tm-green">
        Trusted by teams at
      </div>
      <div className="relative [mask-image:linear-gradient(90deg,transparent_0,#000_12%,#000_88%,transparent_100%)]">
        <div className="flex w-max animate-tm-marquee motion-reduce:animate-none">
          <Row />
          <Row hidden />
        </div>
      </div>
    </div>
  );
}
