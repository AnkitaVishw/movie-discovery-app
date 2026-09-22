export default function Poster({ src, alt, className = "" }) {
  if (!src) {
    return (
      <div className={`poster fallback ${className}`} aria-hidden="true">
        <span>No poster</span>
      </div>
    );
  }
  return <img className={`poster ${className}`} src={src} alt={alt} loading="lazy" />;
}
