
import React from 'react';

export const Flame: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
);

export const Drumstick: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
        <path d="M15.42 8.73a2.5 2.5 0 0 0-2.2-4.8 2.5 2.5 0 0 0-2.8 2.5c-1.41.55-2.3 2-2.3 3.48a4.4 4.4 0 0 0 4.2 4.58c2.4.4 4.3-1.7 4.3-3.9v-.2a2.4 2.4 0 0 0-1.2-2.18Z"/>
        <path d="M12.23 13.55a4.2 4.2 0 0 1-2.9-2.68 4.3 4.3 0 0 1 .45-4.4 4.5 4.5 0 0 1 6.13 1.12 4.2 4.2 0 0 1-2.68 6.04 4.3 4.3 0 0 1-4.4.45Z"/>
        <path d="m13.5 13.5 6 6"/>
    </svg>
);

export const Activity: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
);

export const Zap: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
);
