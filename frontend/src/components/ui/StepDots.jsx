export default function StepDots({ total, current }) {
  const items = [];
  for (let i = 1; i <= total; i += 1) {
    const state = i < current ? 'done' : i === current ? 'current' : '';
    items.push(
      <div key={`d${i}`} className={`step-dot ${state}`}>{i < current ? '✓' : i}</div>
    );
    if (i < total) items.push(<div key={`l${i}`} className="step-line" />);
  }
  return <div className="steps">{items}</div>;
}
