/* Six landscape chapter scenes. Original artwork; simplified, not literal maps. */
import { Frame, Sky, Sun, Cloud, Birds, Pine, Palm, Boat, W, H } from './parts';

const ridge = (pts) => `M0 ${H} ${pts.map(([x, y]) => `L${x} ${y}`).join(' ')} L${W} ${H} Z`;
const smooth = (pts, base = H) => {
  let d = `M0 ${base} L${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i += 1) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const mx = (x0 + x1) / 2;
    d += ` C${mx} ${y0} ${mx} ${y1} ${x1} ${y1}`;
  }
  return `${d} L${W} ${base} Z`;
};
// Snow cap: a small jagged triangle hanging from a peak.
const cap = ([x, y], w = 46, h = 40) => `M${x} ${y} L${x + w} ${y + h} L${x + w * 0.45} ${y + h * 0.72} L${x + w * 0.1} ${y + h * 1.05} L${x - w * 0.3} ${y + h * 0.7} L${x - w} ${y + h} Z`;

export function Himalayas({ title }) {
  const far = [[0, 430], [140, 330], [260, 400], [420, 250], [560, 360], [700, 290], [860, 200], [1010, 330], [1160, 260], [1320, 360], [1460, 280], [1600, 340]];
  const mid = [[0, 560], [180, 450], [330, 520], [520, 400], [700, 520], [880, 430], [1060, 540], [1250, 420], [1420, 520], [1600, 470]];
  return (
    <Frame title={title}>
      <Sky id="sky-him" top="#FFE7D3" mid="#FCD9C0" bottom="#F7C9A8" />
      <g data-rise><Sun x={1190} y={250} r={70} /></g>
      <g data-depth="0.08" data-drift><Cloud x={300} y={170} s={1.1} /><Cloud x={980} y={120} s={0.8} o={0.75} /><Cloud x={1420} y={200} s={0.9} /></g>
      <g data-depth="0.15">
        <path d={ridge(far)} fill="#E7B79A" />
        <g fill="#FFF7EF">{[far[3], far[6], far[8], far[10]].map((p) => <path key={p[0]} d={cap(p)} />)}</g>
      </g>
      <g data-depth="0.3"><Birds x={620} y={300} s={1.1} /></g>
      <g data-depth="0.35">
        <path d={ridge(mid)} fill="#C9866A" />
        <g fill="#FBEDE2" opacity="0.9">{[mid[3], mid[7]].map((p) => <path key={p[0]} d={cap(p, 38, 30)} />)}</g>
      </g>
      <g data-depth="0.6">
        <path d={smooth([[0, 700], [260, 640], [520, 690], [820, 610], [1120, 680], [1400, 630], [1600, 660]])} fill="#8F5843" />
        <path data-draw d="M1500 900 C1300 840 1340 780 1130 760 C930 742 1010 690 820 672 C680 660 700 640 600 632" fill="none" stroke="#FFF7EF" strokeWidth="10" strokeLinecap="round" strokeDasharray="22 18" opacity="0.9" />
      </g>
      <g data-depth="0.9">
        <path d={smooth([[0, 820], [300, 780], [700, 830], [1100, 790], [1600, 820]])} fill="#5B3A2E" />
        {[[60, 830, 170], [150, 840, 130], [240, 815, 190], [1380, 830, 180], [1470, 820, 150], [1550, 840, 200]].map(([x, y, h]) => <Pine key={x} x={x} y={y} h={h} fill="#3A2820" />)}
      </g>
    </Frame>
  );
}

export function RiversValleys({ title }) {
  return (
    <Frame title={title}>
      <Sky id="sky-riv" top="#FFF1DE" mid="#F6E3C6" bottom="#E9D9B4" />
      <g data-rise><Sun x={420} y={230} r={64} fill="#FFF7EF" glow="#FFE7C7" /></g>
      <g data-depth="0.08" data-drift><Cloud x={1100} y={160} s={1} o={0.8} /><Cloud x={260} y={120} s={0.7} o={0.7} /></g>
      <g data-depth="0.18"><path d={smooth([[0, 470], [260, 380], [560, 440], [860, 360], [1180, 430], [1600, 370]])} fill="#B9C9A2" /></g>
      <g data-depth="0.35"><path d={smooth([[0, 560], [300, 480], [620, 560], [980, 470], [1300, 540], [1600, 500]])} fill="#86A982" /></g>
      <g data-depth="0.55">
        <path d={smooth([[0, 660], [350, 600], [700, 650], [1050, 590], [1600, 640]])} fill="#5C8A68" />
        {/* River ribbon widening toward the viewer */}
        <path d="M760 612 C820 640 700 670 760 700 C840 740 620 780 700 820 C760 850 560 880 520 900 L1120 900 C1000 870 1060 840 980 810 C900 780 1000 750 900 712 C840 688 880 650 820 620 Z" fill="#E7D7AE" />
        <path d="M770 616 C824 642 712 672 772 702 C846 740 640 782 716 822 C770 850 600 880 570 900 L1060 900 C960 872 1012 842 944 812 C872 780 968 752 884 714 C832 690 866 654 808 622 Z" fill="#6FA394" />
      </g>
      <g data-depth="0.6" data-wave fill="none" stroke="#FFF7EF" strokeWidth="5" strokeLinecap="round" opacity="0.7">
        <path d="M700 860 q30 -10 60 0 q30 10 60 0" /><path d="M820 790 q24 -8 48 0 q24 8 48 0" /><path d="M780 730 q20 -6 40 0" />
      </g>
      <g data-depth="0.62" data-bob><Boat x={880} y={845} s={0.9} hull="#6B4A32" /></g>
      <g data-depth="0.9">
        <path d={smooth([[0, 820], [260, 790], [500, 840], [520, 900]])} fill="#3F6B4E" />
        <path d="M1100 900 C1180 830 1350 800 1600 790 L1600 900 Z" fill="#3F6B4E" />
        {[[90, 840, 150], [190, 830, 120], [1440, 820, 170], [1530, 830, 140]].map(([x, y, h]) => <Pine key={x} x={x} y={y} h={h} fill="#2C4A37" />)}
      </g>
    </Frame>
  );
}

export function Desert({ title }) {
  return (
    <Frame title={title}>
      <Sky id="sky-des" top="#FFE9C9" mid="#FAD9A6" bottom="#F3C383" />
      <defs>
        <linearGradient id="dusk-des" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E9765A" /><stop offset="1" stopColor="#F4A25B" stopOpacity="0" /></linearGradient>
      </defs>
      {/* Changing sunlight: an evening wash that strengthens as you scroll. Static at 0.25 by default. */}
      <rect data-sun width={W} height={H} fill="url(#dusk-des)" opacity="0.25" />
      <g data-rise><Sun x={1180} y={290} r={92} fill="#FFF3DC" glow="#FFD9A0" /></g>
      <g data-depth="0.2">
        <path d={smooth([[0, 560], [400, 500], [800, 540], [1200, 490], [1600, 530]])} fill="#EDC48A" />
        {/* Hill fort on the far dune */}
        <g fill="#C98A4B">
          <path d="M250 520 L250 452 L276 452 L276 440 L292 440 L292 452 L330 452 L330 430 L350 418 L370 430 L370 452 L420 452 L420 440 L436 440 L436 452 L470 452 L470 520 Z" />
          <path d="M240 470 h240 v8 h-240 z" opacity="0.5" />
        </g>
      </g>
      <g data-depth="0.45"><path d={smooth([[0, 680], [300, 600], [700, 660], [1000, 580], [1350, 640], [1600, 610]])} fill="#E2A35E" /></g>
      <g data-depth="0.55" fill="#7A4A2A">
        {/* Camel caravan silhouette */}
        {[0, 120, 240].map((dx) => (
          <g key={dx} transform={`translate(${980 + dx} ${600 - dx * 0.12})`}>
            <path d="M0 0 q20 -40 50 -20 q20 -30 46 -4 l26 -24 q10 -6 14 6 l-18 30 l0 46 h-8 l-4 -40 h-50 l-6 40 h-8 l2 -46 q-30 6 -44 12 z" />
          </g>
        ))}
      </g>
      <g data-depth="0.85">
        <path d={smooth([[0, 800], [350, 730], [800, 790], [1200, 740], [1600, 780]])} fill="#C97F3E" />
        <path d="M0 860 C400 820 800 870 1600 830 L1600 900 L0 900 Z" fill="#A9652F" />
      </g>
    </Frame>
  );
}

export function Coast({ title }) {
  return (
    <Frame title={title}>
      <Sky id="sky-coa" top="#FFE6D2" mid="#FBD2B4" bottom="#F6B992" />
      <g data-rise><Sun x={800} y={430} r={110} fill="#FFF1DE" glow="#FFD3AE" /></g>
      <g data-depth="0.08" data-drift><Cloud x={300} y={190} s={0.9} o={0.8} /><Cloud x={1300} y={150} s={1.1} o={0.75} /></g>
      <g data-depth="0.25">
        <rect y="500" width={W} height="400" fill="#3F8F7E" />
        <rect y="500" width={W} height="10" fill="#FFE6D2" opacity="0.6" />
        {/* Distant lighthouse headland */}
        <path d="M1260 500 C1320 460 1440 450 1600 470 L1600 500 Z" fill="#2E6B5D" />
        <path d="M1478 462 l10 -78 h16 l10 78 z" fill="#FFF7EF" /><rect x="1484" y="372" width="24" height="14" fill="#E07B4F" />
      </g>
      <g data-depth="0.4" data-wave fill="none" stroke="#FFF7EF" strokeWidth="5" strokeLinecap="round" opacity="0.6">
        <path d="M120 580 q40 -14 80 0 q40 14 80 0" /><path d="M620 620 q40 -14 80 0 q40 14 80 0" /><path d="M1100 570 q40 -14 80 0" /><path d="M360 690 q40 -14 80 0 q40 14 80 0" /><path d="M980 720 q40 -14 80 0 q40 14 80 0" />
      </g>
      <g data-depth="0.5" data-bob><Boat x={520} y={600} s={0.8} hull="#7A4A2A" sail="#E07B4F" /></g>
      <g data-depth="0.55" data-bob><Boat x={1130} y={660} s={1} hull="#5A3B2A" sail="#FFF1DE" /></g>
      <g data-depth="0.85">
        <path d="M0 780 C300 740 700 790 1000 770 C1300 750 1450 800 1600 790 L1600 900 L0 900 Z" fill="#F1D3A6" />
        <Palm x={130} y={860} h={300} lean={1} />
        <Palm x={250} y={880} h={230} lean={1.3} />
        <Palm x={1460} y={870} h={280} lean={-1} />
      </g>
    </Frame>
  );
}

export function Northeast({ title }) {
  return (
    <Frame title={title}>
      <Sky id="sky-ne" top="#F2F0E2" mid="#E4EAD6" bottom="#D2DEC2" />
      <g data-depth="0.12"><path d={smooth([[0, 420], [240, 340], [520, 400], [800, 320], [1120, 390], [1400, 330], [1600, 380]])} fill="#A8C192" /></g>
      {/* Mist: soft-edged bands (radial fade), never hard bars. */}
      <defs>
        <radialGradient id="mist-ne">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.85" />
          <stop offset="0.6" stopColor="#FFFFFF" stopOpacity="0.4" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g data-depth="0.15" data-drift fill="url(#mist-ne)"><ellipse cx="300" cy="405" rx="520" ry="46" /><ellipse cx="1280" cy="372" rx="460" ry="40" /></g>
      <g data-depth="0.3">
        <path d={smooth([[0, 540], [300, 450], [640, 520], [960, 430], [1300, 520], [1600, 470]])} fill="#6F9A5E" />
        {/* Waterfall down the mid hill */}
        <path d="M1010 452 C1000 520 1030 560 1016 640 L1060 640 C1070 560 1046 520 1046 452 Z" fill="#F4F2E8" />
        <g data-wave stroke="#D2DEC2" strokeWidth="4" strokeDasharray="10 14"><path d="M1024 470 V630" /><path d="M1038 470 V630" /></g>
      </g>
      <g data-depth="0.35" data-drift fill="url(#mist-ne)" opacity="0.8"><ellipse cx="580" cy="572" rx="460" ry="42" /></g>
      <g data-depth="0.6"><path d={smooth([[0, 700], [380, 620], [760, 690], [1150, 630], [1600, 680]])} fill="#47744A" /></g>
      <g data-depth="0.9">
        <path d="M0 900 L0 780 C200 760 360 800 420 900 Z" fill="#2E5233" />
        <path d="M1600 900 L1600 770 C1400 760 1260 800 1180 900 Z" fill="#2E5233" />
        {/* Living root bridge: woven arches between the banks */}
        <g fill="none" stroke="#6B4A32" strokeLinecap="round">
          <path d="M360 820 C620 700 980 700 1240 820" strokeWidth="18" />
          <path d="M360 836 C620 732 980 732 1240 836" strokeWidth="10" opacity="0.8" />
          {[480, 580, 680, 780, 880, 980, 1080].map((x) => <path key={x} d={`M${x} ${760 - Math.sin(((x - 360) / 880) * Math.PI) * 30} v60`} strokeWidth="6" opacity="0.7" />)}
        </g>
      </g>
    </Frame>
  );
}

export function CultureHeritage({ title }) {
  return (
    <Frame title={title}>
      <Sky id="sky-cul" top="#FFE5D1" mid="#F8CFB4" bottom="#F0B48E" />
      <g data-rise><Sun x={1240} y={240} r={70} /></g>
      <g data-depth="0.1" data-drift>
        {/* Kites */}
        <g transform="translate(360 210) rotate(12)"><path d="M0 -36 L28 0 L0 36 L-28 0 Z" fill="#B4461A" /><path d="M0 36 q12 40 -6 80" stroke="#5A3E32" strokeWidth="2" fill="none" /></g>
        <g transform="translate(980 150) rotate(-8) scale(0.8)"><path d="M0 -36 L28 0 L0 36 L-28 0 Z" fill="#F26A2E" /><path d="M0 36 q-12 40 6 80" stroke="#5A3E32" strokeWidth="2" fill="none" /></g>
      </g>
      <g data-depth="0.2" fill="#DFA585">
        <rect x="80" y="430" width="380" height="200" /><path d="M120 430 q40 -60 80 0 z M300 430 q40 -60 80 0 z" />
        <rect x="1180" y="420" width="360" height="210" /><path d="M1240 420 q60 -90 120 0 z" /><rect x="1196" y="360" width="16" height="70" /><rect x="1508" y="360" width="16" height="70" />
      </g>
      <g data-depth="0.4" fill="#C0704C">
        {/* Central domed monument with minarets */}
        <rect x="560" y="470" width="480" height="230" />
        <path d="M640 470 C640 330 960 330 960 470 Z" />
        <path d="M800 330 v-40" stroke="#C0704C" strokeWidth="8" /><circle cx="800" cy="286" r="8" />
        <rect x="520" y="330" width="26" height="370" /><path d="M520 330 q13 -40 26 0 z" />
        <rect x="1054" y="330" width="26" height="370" /><path d="M1054 330 q13 -40 26 0 z" />
        <g fill="#F6DFCF" opacity="0.55">{[600, 700, 800, 900].map((x) => <path key={x} d={`M${x} 700 v-90 a40 40 0 0 1 80 0 v90 z`} />)}</g>
      </g>
      <g data-depth="0.75" fill="#8E3F22">
        <path d="M0 760 h1600 v140 h-1600 z" />
        {Array.from({ length: 12 }, (_, i) => i * 140 + 10).map((x) => <path key={x} d={`M${x} 900 v-110 a50 50 0 0 1 100 0 v110 z`} fill="#F6DFCF" opacity="0.25" />)}
        <path d="M0 740 h1600 v22 h-1600 z" fill="#A24C2A" />
      </g>
    </Frame>
  );
}

export const LANDSCAPE_SCENES = {
  himalayas: Himalayas,
  'rivers-valleys': RiversValleys,
  desert: Desert,
  coast: Coast,
  northeast: Northeast,
  'culture-heritage': CultureHeritage,
};
