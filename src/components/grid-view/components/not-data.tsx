import { t } from 'i18next';
import { varAlpha } from 'minimal-shared/utils';

import { Box, Typography } from '@mui/material';

export function NoData({ sx }: { sx?: Sx }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: 1,
        boxSizing: 'content-box',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: (th) => varAlpha(th.palette.grey['500Channel'], 0.04),
        border: 1,
        borderRadius: 1,
        borderColor: (th) => varAlpha(th.palette.grey['500Channel'], 0.08),
        borderStyle: 'dashed',
        py: 1,
        ...sx,
      }}
    >
      <Box
        component="img"
        loading="lazy"
        sx={{
          width: 150,
          height: 150,
        }}
        src="/assets/ic-content.svg"
      />
      <Typography variant="h6" color="textDisabled">
        {t('No data')}
      </Typography>
    </Box>
  );
}
