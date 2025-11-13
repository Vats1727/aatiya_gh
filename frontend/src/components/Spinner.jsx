import React from 'react';

// Small accessible spinner used across the app for loading states.
// - role/status + aria-live so screen readers announce it
// - visually-hidden label for assistive tech
export default function Spinner({ size = 36, label = 'Loading...' }) {
  const srStyle = {
    position: 'absolute',
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: 0,
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} role="status" aria-live="polite" aria-busy="true">
      <svg
        width={size}
        height={size}
        viewBox="0 0 50 50"
        aria-hidden="true"
        style={{ marginRight: 12 }}
      >
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="90"
          strokeDashoffset="30"
        >
          <animateTransform
            attributeType="xml"
            attributeName="transform"
            type="rotate"
            from="0 25 25"
            to="360 25 25"
            dur="0.9s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
      <span style={srStyle}>{label}</span>
    </div>
  );
}
