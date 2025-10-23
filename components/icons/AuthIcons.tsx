
import React from 'react';

export const FingerprintIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 12h.01" />
    <path d="M10 12h.01" />
    <path d="M14 12h.01" />
    <path d="M7 15h.01" />
    <path d="M17 15h.01" />
    <path d="M2 12c2.2 0 4.2.8 5.8 2.2" />
    <path d="M12 22c2.7 0 5.2-1.2 6.9-3.1" />
    <path d="M22 12c-2.2 0-4.2-.8-5.8-2.2" />
    <path d="M12 2c-2.7 0-5.2 1.2-6.9 3.1" />
    <path d="M7.5 18.4c.5.5 1.2.8 2 .9" />
    <path d="M12 12c0 2.2.8 4.2 2.2 5.8" />
    <path d="M12 2c0 2.2-.8 4.2-2.2 5.8" />
    <path d="M16.5 5.6c-.5-.5-1.2-.8-2-.9" />
  </svg>
);
