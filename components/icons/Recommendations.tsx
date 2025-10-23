
import React from 'react';

export const Droplets: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.7-3.29-1.12-1.02-1.7-2.3-1.7-3.5 0-2.2 1.8-4 4-4 .9 0 1.7.3 2.4.9" />
    <path d="M12.2 18.8c.5-1.7 1.6-3.5 3.4-4.8 1.4-1 2.3-2.1 2.3-3.2 0-2.2-1.8-4-4-4s-4 1.8-4 4c0 .4.1.8.2 1.2" />
  </svg>
);

export const BedDouble: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M2 18v3" />
    <path d="M22 18v3" />
    <path d="M4 12v6h16v-6" />
    <path d="M2 12h20" />
    <path d="M4 6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4" />
    <path d="M12 6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4" />
  </svg>
);

export const Info: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </svg>
);
