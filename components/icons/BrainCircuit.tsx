
import React from 'react';

export const BrainCircuit: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 0 0 9 22a4 4 0 0 0 5-2.488 4 4 0 0 0 .555-6.588 4 4 0 0 0-2.525-5.77A3 3 0 0 0 12 5Z" />
    <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 0 1 15 22a4 4 0 0 1-5-2.488" />
    <path d="M12 12h.01" />
    <path d="M17 9h.01" />
    <path d="M7 9h.01" />
    <path d="M16 15h.01" />
    <path d="M8 15h.01" />
  </svg>
);
