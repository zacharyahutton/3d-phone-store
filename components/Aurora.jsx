import './Aurora.css';

export default function Aurora({
  colorStops = ['#1d4ed8', '#67e8f9', '#020617'],
  speed = 0.5,
  blend = 0.5,
  amplitude = 1,
}) {
  return (
    <div
      className="aurora-container"
      style={{
        '--aurora-color-a': colorStops[0],
        '--aurora-color-b': colorStops[1],
        '--aurora-color-c': colorStops[2],
        '--aurora-speed': `${Math.max(6, 18 / Math.max(0.2, speed))}s`,
        '--aurora-blend': blend,
        '--aurora-amplitude': amplitude,
      }}
    />
  );
}
