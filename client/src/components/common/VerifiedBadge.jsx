import React from 'react';
import { Tooltip, Box } from '@mui/material';

/**
 * VerifiedBadge — Professional trust signal badge
 * 
 * Inspired by platform verification badges (Twitter, Instagram).
 * Renders a circular shield-check SVG with gradient fill and subtle glow.
 * 
 * Props:
 *   size: 'sm' (16px) | 'md' (20px) | 'lg' (24px)
 *   label: Tooltip text (default: "Verified")
 *   sx: Additional MUI sx overrides
 */
const SIZES = { sm: 16, md: 20, lg: 24 };

const VerifiedBadge = ({ size = 'md', label = 'Verified', sx = {} }) => {
  const px = SIZES[size] || SIZES.md;
  const id = React.useId().replace(/:/g, '');

  return (
    <Tooltip title={label} arrow placement="top">
      <Box
        component="span"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: px,
          height: px,
          flexShrink: 0,
          filter: 'drop-shadow(0 1px 3px rgba(94, 106, 210, 0.35))',
          ...sx,
        }}
      >
        <svg
          width={px}
          height={px}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={`vb-grad-${id}`} x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#6C73DB" />
              <stop offset="100%" stopColor="#4B55C4" />
            </linearGradient>
          </defs>
          {/* Outer badge shape — 8-pointed star / certificate seal */}
          <path
            d="M12 1.5
               L14.09 4.26 L17.27 3.27 L17.64 6.6 L20.73 7.95
               L19.5 11.04 L21.18 13.8 L18.42 15.48 L18.06 18.81
               L14.73 18.45 L12 20.73 L9.27 18.45 L5.94 18.81
               L5.58 15.48 L2.82 13.8 L4.5 11.04 L3.27 7.95
               L6.36 6.6 L6.73 3.27 L9.91 4.26 Z"
            fill={`url(#vb-grad-${id})`}
          />
          {/* Inner checkmark */}
          <path
            d="M8.5 12.5L10.8 14.8L15.5 9.5"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </Box>
    </Tooltip>
  );
};

export default VerifiedBadge;
