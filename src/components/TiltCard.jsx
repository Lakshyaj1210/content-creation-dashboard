import { useRef } from 'react';

/**
 * Glass card with pointer-driven 3D tilt. Rotation + spotlight position are written to CSS custom
 * properties (--rx, --ry, --mx, --my) so React never re-renders on mouse move.
 */
export default function TiltCard({ as: Tag = 'div', i = 0, max = 7, className = '', style, children, ...rest }) {
  const ref = useRef(null);
  const set = (k, v) => ref.current?.style.setProperty(k, v);
  const move = (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width; const y = (e.clientY - r.top) / r.height;
    set('--ry', `${((x - 0.5) * max * 2).toFixed(2)}deg`); set('--rx', `${(-(y - 0.5) * max * 2).toFixed(2)}deg`);
    set('--mx', `${(x * 100).toFixed(1)}%`); set('--my', `${(y * 100).toFixed(1)}%`);
  };
  const leave = () => { set('--rx', '0deg'); set('--ry', '0deg'); };
  return (
    <Tag ref={ref} onPointerMove={move} onPointerLeave={leave} className={`tilt enter ${className}`} style={{ '--i': i, ...style }} {...rest}>
      {children}
    </Tag>
  );
}
