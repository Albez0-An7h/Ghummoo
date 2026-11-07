import { LANDSCAPE_SCENES } from './landscapes';
import { CITY_SCENES } from './cities';
import { cx } from '../components/ui';

export { LANDSCAPE_SCENES, CITY_SCENES };

/* Generic place artwork for places without a dedicated scene: the place's palette (or its
   landscape's) with a simple silhouette chosen by place type. Decorative. */
const SILHOUETTE = {
  mountain: 'M0 100 L22 52 L34 66 L52 30 L70 60 L82 46 L100 100 Z',
  water: 'M0 72 q12 -8 25 0 t25 0 t25 0 t25 0 V100 H0 Z',
  city: 'M0 100 V70 h14 V56 h10 V70 h8 V44 q10 -16 20 0 V70 h10 V60 h12 V70 h14 V100 Z',
  forest: 'M0 100 L10 70 L20 100 Z M16 100 L30 56 L44 100 Z M38 100 L52 66 L66 100 Z M60 100 L76 50 L92 100 Z',
};
const shapeFor = (p) => {
  if (['hill_station', 'valley', 'village'].includes(p.placeType)) return 'mountain';
  if (['beach', 'backwaters', 'lake'].includes(p.placeType)) return 'water';
  if (p.placeType === 'national_park') return 'forest';
  return 'city';
};

export function PlaceArt({ place, palette, className, label }) {
  const Scene = CITY_SCENES[place.slug];
  if (Scene) return <div className={cx('overflow-hidden', className)}><Scene title={label} /></div>;
  const pal = palette || place.theme?.palette || { primary: '#E07B4F', secondary: '#FBE3D2', ink: '#2B2320' };
  return (
    <div className={cx('relative overflow-hidden', className)} style={{ background: `linear-gradient(160deg, ${pal.secondary}, ${pal.primary})` }} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMax slice" className="absolute inset-x-0 bottom-0 h-3/5 w-full" aria-hidden>
        <path d={SILHOUETTE[shapeFor(place)]} fill={pal.ink} opacity="0.35" />
      </svg>
      <span className="absolute left-4 top-4 h-10 w-10 rounded-full bg-white/50" aria-hidden />
    </div>
  );
}

export function LandscapeArt({ slug, className, title }) {
  const Scene = LANDSCAPE_SCENES[slug];
  return <div className={cx('overflow-hidden', className)}>{Scene ? <Scene title={title} /> : null}</div>;
}
