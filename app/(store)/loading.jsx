export default function Loading() {
  return (
    <div className="container page" aria-busy="true" aria-label="Loading">
      <div className="skeleton skeleton--eyebrow" />
      <div className="skeleton skeleton--title" />
      <div className="product-grid">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="card card--skeleton">
            <div className="skeleton skeleton--media" />
            <div className="skeleton skeleton--line" />
            <div className="skeleton skeleton--line skeleton--short" />
          </div>
        ))}
      </div>
    </div>
  );
}
