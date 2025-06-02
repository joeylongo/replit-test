import React from 'react';
import { Backdrop, Box, keyframes } from '@mui/material';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';

/* ———————————————————————
   Animation keyframes
   — spin the wand and make it “pulse” */
const spinWand = keyframes`
  0%   { transform: rotate(0deg)   scale(1);   opacity: 0.8; }
  50%  { transform: rotate(180deg) scale(1.2); opacity: 1;   }
  100% { transform: rotate(360deg) scale(1);   opacity: 0.8; }
`;

/* ———————————————————————
   Loading overlay component
   ——————————————————————— */
const LoadingOverlay = ({ open }) => (
  <Backdrop
    open={open}
    /* zIndex above drawers & modals; translucent white */
    sx={{
      zIndex: (theme) => theme.zIndex.drawer + 100,
      backgroundColor: 'rgba(255,255,255,0.6)',
    }}
  >
    <Box
      sx={{
        display: 'inline-flex',
        animation: `${spinWand} 2s ease-in-out infinite`,
        filter: 'drop-shadow(0 0 6px rgba(0,0,0,0.4))',
      }}
    >
      <AutoFixHighIcon sx={{ fontSize: 72, color: 'primary.main' }} />
    </Box>
  </Backdrop>
);

export default LoadingOverlay;
