import { useState, useEffect } from 'react';

// Suspense fallback with a minimum delay.
// On a fast connection a lazy chunk arrives in a few milliseconds; showing a
// spinner for that instant just looks like a flicker. So for the first
// `delay` ms we render nothing, and only show the spinner if the chunk is
// still loading after that.
function PageLoader({ text = 'Loading page...', delay = 300 }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer); // chunk arrived first -> never shown
  }, [delay]);

  if (!visible) return null;

  return (
    <div className="page-loader" role="status">
      <span className="spinner" />
      <span>{text}</span>
    </div>
  );
}

export default PageLoader;
