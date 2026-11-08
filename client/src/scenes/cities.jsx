/* Featured city scenes: original compositions of recognisable landmarks, each in its own colour
   mood. Simplified illustrations, not architectural drawings. */
import { Frame, Sky, Sun, Cloud, Birds, Boat, archPath, W, H } from './parts';

/* ------------------------------ Jaipur ------------------------------------ */
// Hawa Mahal: stepped honeycomb façade of small arched windows.
function HawaMahal({ cx = 1000, base = 880 }) {
  const tiers = [
    { w: 760, h: 120 }, { w: 680, h: 100 }, { w: 580, h: 92 }, { w: 460, h: 84 }, { w: 320, h: 78 },
  ];
  let y = base;
  const out = [];
  tiers.forEach((t, i) => {
    const top = y - t.h;
    const x0 = cx - t.w / 2;
    out.push(<rect key={`t${i}`} x={x0} y={top} width={t.w} height={t.h} fill={i % 2 ? '#E7907F' : '#DD7C6B'} />);
    // crenellated cornice
    out.push(<rect key={`c${i}`} x={x0 - 8} y={top - 10} width={t.w + 16} height={12} fill="#F6D5C4" />);
    const n = Math.floor(t.w / 46);
    const gap = t.w / n;
    for (let k = 0; k < n; k += 1) {
      const wx = x0 + k * gap + gap * 0.2;
      const ww = gap * 0.6;
      out.push(<path key={`w${i}-${k}`} d={archPath(wx, top + t.h * 0.22, ww, t.h * 0.6)} fill="#A84B44" />);
      out.push(<path key={`b${i}-${k}`} d={`M${wx - 3} ${top + t.h * 0.86} h${ww + 6}`} stroke="#F6D5C4" strokeWidth="4" />);
    }
    y = top - 10;
  });
  // crown domes
  [-110, -40, 30, 100].map((dx) => out.push(<path key={`d${dx}`} d={`M${cx + dx - 26} ${y} q26 -56 52 0 z`} fill="#DD7C6B" />));
  out.push(<path key="spire" d={`M${cx - 6} ${y - 40} h12 l-6 -30 z`} fill="#F6D5C4" />);
  return <g>{out}</g>;
}

export function Jaipur({ title }) {
  return (
    <Frame title={title}>
      <Sky id="sky-jai" top="#FFE3D6" mid="#F9C9B8" bottom="#F2AE9C" />
      <g data-rise><Sun x={380} y={230} r={72} fill="#FFF1E6" glow="#FFD3C2" /></g>
      <g data-depth="0.08" data-drift>
        <g transform="translate(1260 170) rotate(14)"><path d="M0 -30 L24 0 L0 30 L-24 0 Z" fill="#B4461A" /><path d="M0 30 q10 34 -6 70" stroke="#5A2E2A" strokeWidth="2" fill="none" /></g>
        <g transform="translate(660 120) rotate(-10) scale(0.7)"><path d="M0 -30 L24 0 L0 30 L-24 0 Z" fill="#F26A2E" /></g>
      </g>
      {/* Aravalli ridge with Amber Fort ramparts */}
      <g data-depth="0.15">
        <path d="M0 520 C200 430 360 470 520 400 C700 330 880 420 1060 380 C1260 340 1420 420 1600 380 L1600 900 L0 900 Z" fill="#E4A08F" />
        <path d="M120 470 L300 440 L480 410 L620 380" fill="none" stroke="#C97A68" strokeWidth="10" strokeDasharray="14 6" />
        <g fill="#C97A68">
          <rect x="560" y="330" width="230" height="80" /><rect x="600" y="300" width="150" height="34" />
          <path d="M610 300 q20 -34 40 0 z M700 300 q20 -34 40 0 z" />
          {[570, 600, 630, 660, 690, 720, 750].map((x) => <rect key={x} x={x} y={322} width="14" height="10" />)}
        </g>
      </g>
      <g data-depth="0.38" fill="#D98C7B">
        {/* Old-city rooftops and chhatris */}
        <path d="M0 640 h1600 v260 h-1600 z" />
        {[60, 220, 400, 1460, 1300].map((x) => <g key={x}><rect x={x} y={590} width="110" height="60" /><path d={`M${x + 20} 590 q35 -50 70 0 z`} /></g>)}
      </g>
      <g data-depth="0.25"><Birds x={1150} y={330} s={0.9} stroke="#7A3A33" /></g>
      <g data-depth="0.7"><HawaMahal cx={1010} base={900} /></g>
      <g data-depth="0.9" fill="#A84B44"><path d="M0 860 C200 840 300 880 420 900 L0 900 Z" /></g>
    </Frame>
  );
}

/* ------------------------------ Varanasi ---------------------------------- */
const shikhara = (x, base, w, h) => `M${x - w / 2} ${base} L${x - w / 2} ${base - h * 0.35} C${x - w / 2} ${base - h * 0.8} ${x - w * 0.12} ${base - h * 0.95} ${x} ${base - h} C${x + w * 0.12} ${base - h * 0.95} ${x + w / 2} ${base - h * 0.8} ${x + w / 2} ${base - h * 0.35} L${x + w / 2} ${base} Z`;

export function Varanasi({ title }) {
  return (
    <Frame title={title}>
      <Sky id="sky-var" top="#FFE7C8" mid="#FBCF96" bottom="#F2B26E" />
      <g data-rise><Sun x={1240} y={300} r={80} fill="#FFF3DD" glow="#FFD69B" /></g>
      <g data-depth="0.1"><Birds x={1000} y={200} s={1} stroke="#6A4227" /></g>
      {/* Far haze of the old city */}
      <g data-depth="0.15" fill="#E9B27C">
        {[[40, 120], [170, 150], [300, 110], [430, 170], [560, 130], [690, 160], [820, 120], [950, 150], [1080, 110], [1210, 140], [1340, 120], [1470, 160]].map(([x, h]) => <rect key={x} x={x} y={430 - h} width="118" height={h + 40} />)}
      </g>
      {/* Temples and riverfront buildings */}
      <g data-depth="0.35" fill="#C98146">
        <rect x="0" y="420" width={W} height="160" />
        <path d={shikhara(300, 430, 120, 220)} /><path d={shikhara(420, 430, 80, 150)} />
        <path d={shikhara(980, 430, 140, 250)} /><path d={shikhara(1110, 430, 90, 170)} />
        <rect x="560" y="330" width="220" height="100" /><path d="M600 330 q30 -40 60 0 z M680 330 q30 -40 60 0 z" />
        <rect x="1300" y="340" width="200" height="90" />
        <g fill="#F7DFC2" opacity="0.5">{[40, 140, 240, 560, 640, 720, 1300, 1380, 1460].map((x) => <rect key={x} x={x} y={470} width="30" height="44" rx="15" />)}</g>
        <path d="M300 210 v-30 l20 10 -20 10" fill="#E9765A" /><path d="M980 180 v-30 l20 10 -20 10" fill="#E9765A" />
      </g>
      {/* Ghat steps */}
      <g data-depth="0.5">
        <path d="M0 580 h1600 v100 h-1600 z" fill="#B06F3E" />
        {Array.from({ length: 7 }, (_, i) => <rect key={i} x="0" y={590 + i * 14} width={W} height="4" fill="#8E5530" opacity="0.6" />)}
        {[200, 520, 860, 1180, 1460].map((x) => <g key={x} fill="#F26A2E"><path d={`M${x} 588 v-40`} stroke="#5A3B2A" strokeWidth="4" /><path d={`M${x - 46} 552 q46 -46 92 0 z`} /></g>)}
      </g>
      {/* The Ganga */}
      <g data-depth="0.65">
        <rect y="680" width={W} height="220" fill="#D9A15E" />
        <rect y="680" width={W} height="220" fill="#C7894A" opacity="0.4" />
      </g>
      <g data-depth="0.7" data-wave fill="none" stroke="#FFF1DE" strokeWidth="5" strokeLinecap="round" opacity="0.55">
        <path d="M100 740 q40 -12 80 0 q40 12 80 0" /><path d="M700 780 q40 -12 80 0 q40 12 80 0" /><path d="M1240 730 q40 -12 80 0" /><path d="M400 840 q40 -12 80 0 q40 12 80 0" />
      </g>
      {/* Floating diyas */}
      <g data-depth="0.72" data-wave fill="#FFB25C">{[620, 660, 1020, 1060, 1100].map((x, i) => <circle key={x} cx={x} cy={800 + (i % 2) * 18} r="6" />)}</g>
      <g data-depth="0.8" data-bob><Boat x={420} y={770} s={1.1} hull="#5A3B2A" /></g>
      <g data-depth="0.85" data-bob><Boat x={1180} y={830} s={1.3} hull="#6B4A32" /></g>
    </Frame>
  );
}

/* ------------------------------- Delhi ------------------------------------ */
function QutubMinar({ x = 300, base = 760, h = 560 }) {
  const bands = 5;
  const out = [];
  for (let i = 0; i < bands; i += 1) {
    const y1 = base - (h / bands) * i;
    const y2 = base - (h / bands) * (i + 1);
    const w1 = 92 - i * 12;
    const w2 = 92 - (i + 1) * 12;
    out.push(<path key={i} d={`M${x - w1 / 2} ${y1} L${x - w2 / 2} ${y2} L${x + w2 / 2} ${y2} L${x + w1 / 2} ${y1} Z`} fill={i % 2 ? '#C9764F' : '#B5603F'} />);
    out.push(<rect key={`b${i}`} x={x - w2 / 2 - 10} y={y2 - 6} width={w2 + 20} height="10" fill="#EFD3BC" />);
    for (let f = -2; f <= 2; f += 1) out.push(<path key={`f${i}${f}`} d={`M${x + (f * w1) / 6} ${y1} L${x + (f * w2) / 6} ${y2}`} stroke="#8E4A30" strokeWidth="2" opacity="0.5" />);
  }
  out.push(<path key="top" d={`M${x - 14} ${base - h - 4} q14 -30 28 0 z`} fill="#B5603F" />);
  return <g>{out}</g>;
}

function HumayunsTomb({ cx = 860, base = 760 }) {
  return (
    <g>
      <rect x={cx - 300} y={base - 110} width="600" height="110" fill="#C0704C" />
      <rect x={cx - 220} y={base - 260} width="440" height="150" fill="#D48A62" />
      <path d={`M${cx - 130} ${base - 260} C${cx - 140} ${base - 420} ${cx + 140} ${base - 420} ${cx + 130} ${base - 260} Z`} fill="#F4E8DE" />
      <path d={`M${cx} ${base - 395} v-40`} stroke="#B98A54" strokeWidth="6" /><circle cx={cx} cy={base - 438} r="7" fill="#B98A54" />
      {[-190, 190].map((dx) => <g key={dx}><rect x={cx + dx - 26} y={base - 300} width="52" height="40" fill="#D48A62" /><path d={`M${cx + dx - 30} ${base - 300} q30 -46 60 0 z`} fill="#F4E8DE" /></g>)}
      <g fill="#8E4A30" opacity="0.55">
        <path d={archPath(cx - 60, base - 240, 120, 130)} />
        {[-260, -170, 110, 200].map((dx) => <path key={dx} d={archPath(cx + dx, base - 92, 60, 80)} />)}
        {[-170, 110].map((dx) => <path key={`u${dx}`} d={archPath(cx + dx, base - 230, 60, 100)} />)}
      </g>
    </g>
  );
}

function IndiaGate({ cx = 1320, base = 840 }) {
  return (
    <g fill="#C27B4A">
      <rect x={cx - 150} y={base - 330} width="300" height="330" />
      <rect x={cx - 170} y={base - 360} width="340" height="40" />
      <rect x={cx - 130} y={base - 400} width="260" height="40" />
      <path d={`M${cx - 70} ${base - 410} h140 l-20 -26 h-100 z`} />
      <path d={archPath(cx - 70, base - 250, 140, 250)} fill="#FBE3CF" />
      <rect x={cx - 170} y={base - 300} width="340" height="10" fill="#E6B58F" />
    </g>
  );
}

export function Delhi({ title }) {
  return (
    <Frame title={title}>
      <Sky id="sky-del" top="#FFE8D8" mid="#F8D0B8" bottom="#EEB696" />
      <g data-rise><Sun x={600} y={210} r={66} /></g>
      <g data-depth="0.08" data-drift><Cloud x={1100} y={150} s={0.9} o={0.7} /><Cloud x={180} y={120} s={0.7} o={0.6} /></g>
      <g data-depth="0.15"><path d="M0 600 C400 560 800 590 1200 560 C1400 548 1500 570 1600 560 L1600 900 L0 900 Z" fill="#E5B699" /></g>
      <g data-depth="0.22"><QutubMinar x={260} base={780} h={540} /></g>
      <g data-depth="0.4"><HumayunsTomb cx={820} base={790} /></g>
      <g data-depth="0.3"><Birds x={1040} y={260} s={1} stroke="#6A3A28" /></g>
      <g data-depth="0.6"><path d="M0 790 h1600 v110 h-1600 z" fill="#B5543C" /><rect y="790" width={W} height="12" fill="#D9805F" /></g>
      <g data-depth="0.72"><IndiaGate cx={1330} base={850} /></g>
      <g data-depth="0.92" fill="#7E3A28"><path d="M0 860 C300 850 600 880 900 870 C1200 860 1400 880 1600 870 L1600 900 L0 900 Z" /></g>
    </Frame>
  );
}

/* ------------------------------- Mumbai ----------------------------------- */
function GatewayOfIndia({ cx = 520, base = 700 }) {
  return (
    <g>
      <rect x={cx - 260} y={base - 300} width="520" height="300" fill="#C9A27E" />
      <path d={archPath(cx - 90, base - 250, 180, 250)} fill="#2E5E54" />
      {[-210, 130].map((dx) => <path key={dx} d={archPath(cx + dx, base - 170, 80, 170)} fill="#2E5E54" opacity="0.85" />)}
      <rect x={cx - 280} y={base - 330} width="560" height="34" fill="#B88F6A" />
      {[-250, -120, 90, 220].map((dx) => (
        <g key={dx} fill="#C9A27E"><rect x={cx + dx} y={base - 400} width="30" height="74" /><path d={`M${cx + dx - 6} ${base - 400} q21 -36 42 0 z`} /></g>
      ))}
      <g fill="#DCC2A6" opacity="0.6">{Array.from({ length: 9 }, (_, i) => <rect key={i} x={cx - 240 + i * 60} y={base - 322} width="24" height="16" />)}</g>
    </g>
  );
}

export function Mumbai({ title }) {
  return (
    <Frame title={title}>
      <Sky id="sky-mum" top="#FFE6D6" mid="#F8C9AE" bottom="#EFA987" />
      <g data-rise><Sun x={1240} y={380} r={90} fill="#FFF0E2" glow="#FFC9A6" /></g>
      <g data-depth="0.08" data-drift><Cloud x={360} y={150} s={1} o={0.7} /><Cloud x={980} y={110} s={0.8} o={0.6} /></g>
      {/* Marine Drive skyline across the bay */}
      <g data-depth="0.18">
        <g fill="#9FBFAF">{[[820, 120], [880, 170], [950, 140], [1020, 210], [1090, 160], [1160, 240], [1230, 190], [1300, 150], [1370, 220], [1440, 170], [1510, 200], [1560, 140]].map(([x, h]) => <rect key={x} x={x} y={520 - h} width="58" height={h} />)}</g>
        <path d="M780 520 C1000 540 1300 540 1600 520 L1600 530 L780 530 Z" fill="#F7E2CC" />
        <g fill="#FFE6A8">{Array.from({ length: 26 }, (_, i) => <circle key={i} cx={800 + i * 31} cy={524 + Math.sin(i / 4) * 3} r="3.5" />)}</g>
      </g>
      <g data-depth="0.3"><rect y="530" width={W} height="370" fill="#2E7D6B" /></g>
      <g data-depth="0.4" data-wave fill="none" stroke="#DCEDE6" strokeWidth="5" strokeLinecap="round" opacity="0.55">
        <path d="M900 600 q40 -12 80 0 q40 12 80 0" /><path d="M1260 640 q40 -12 80 0" /><path d="M200 780 q40 -12 80 0 q40 12 80 0" /><path d="M1100 760 q40 -12 80 0 q40 12 80 0" />
      </g>
      <g data-depth="0.55"><path d="M0 700 h900 v30 h-900 z" fill="#8F7A62" /><GatewayOfIndia cx={420} base={702} /></g>
      <g data-depth="0.6" data-bob><Boat x={1000} y={700} s={0.9} hull="#5A3B2A" sail="#E07B4F" /></g>
      <g data-depth="0.75" data-bob><Boat x={1340} y={820} s={1.2} hull="#7A4A2A" sail="#FFF1DE" /></g>
      <g data-depth="0.8" data-bob><Boat x={640} y={840} s={1.1} hull="#3E2A20" /></g>
    </Frame>
  );
}

export const CITY_SCENES = { jaipur: Jaipur, varanasi: Varanasi, delhi: Delhi, mumbai: Mumbai };
