import type { SVGProps } from "react";

const GitManagerAppIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 32 32" fill="none" className="size-6">
    <rect width="32" height="32" rx="6" className="fill-ring" />
    <g transform="translate(16,16)">
      <line
        x1="0"
        y1="-8"
        x2="0"
        y2="8"
        className="stroke-background"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <line
        x1="0"
        y1="-1"
        x2="5.5"
        y2="-6"
        className="stroke-background"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle
        cx="0"
        cy="-8"
        r="2"
        className="fill-ring stroke-background"
        strokeWidth="1.8"
      />
      <circle
        cx="0"
        cy="-1"
        r="2"
        className="fill-ring stroke-background"
        strokeWidth="1.8"
      />
      <circle cx="0" cy="8" r="2" className="fill-background" />
      <circle
        cx="5.5"
        cy="-6"
        r="2"
        className="fill-ring stroke-background"
        strokeWidth="1.8"
      />
    </g>
  </svg>
);

export { GitManagerAppIcon };
