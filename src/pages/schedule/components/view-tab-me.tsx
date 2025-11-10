import type { Control } from 'react-hook-form';

import dayjs from 'dayjs';
import { Controller } from 'react-hook-form';

import { Box, Stack, TextField, Typography } from '@mui/material';
import { MobileTimePicker } from '@mui/x-date-pickers/MobileTimePicker';

import { t } from 'src/i18n';
import { db } from 'src/database/dexie';

import { NumberField } from 'src/components/fields/number-field';
import { DatePickerField } from 'src/components/fields/date-picker-field';

export function ViewTabMe({
  control,
}: {
  control: Control<
    Schedule & {
      day: Dayjs;
      time: Dayjs;
    }
  >;
}) {
  return (
    <Stack spacing={2}>
      <Controller
        control={control}
        name="title"
        rules={{
          required: t('Title is required'),
        }}
        defaultValue=""
        render={({ field, fieldState: { error, invalid } }) => (
          <TextField
            {...field}
            error={invalid}
            helperText={error?.message}
            label={t('Title')}
            required
          />
        )}
      />
      <Controller
        control={control}
        name="body"
        render={({ field, fieldState: { error, invalid } }) => (
          <TextField
            {...field}
            error={invalid}
            helperText={error?.message}
            label={t('Description')}
            multiline
            minRows={2}
          />
        )}
      />
      <Controller
        control={control}
        name="day"
        defaultValue={dayjs().add(7, 'day')}
        render={({ field, fieldState: { error, invalid } }) => (
          <DatePickerField
            enableAccessibleFieldDOMStructure={false}
            {...field}
            error={invalid}
            minDate={dayjs()}
            helperText={error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="time"
        defaultValue={dayjs('20:00', 'HH:mm')}
        rules={{
          validate: async (val, { day }) =>
            (await db.schedules
              .where({
                timeHandle: val.format('HH:mm'),
                dateHandle: day.format('DD MMM YYYY'),
              })
              .count()) === 0 || t('Schedule already exists'),
          deps: ['day'],
        }}
        render={({ field: { value, onChange, ...field } }) => (
          <MobileTimePicker
            label={t('Time start')}
            enableAccessibleFieldDOMStructure={false}
            {...field}
            value={value || null}
            onChange={(v) => onChange(v ?? dayjs('00:00', 'HH:mm'))}
            ampm={false}
          />
        )}
      />
      <Box
        display="flex"
        sx={{
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          alignItems: 'center',
          p: 1.5,
          pl: 2,
          gap: 1,
        }}
      >
        <Typography variant="body1" flex={1}>
          {t('Time handle (hours)')}
        </Typography>
        <Controller
          control={control}
          name="studyTime"
          defaultValue={1}
          render={({ field }) => <NumberField min={0.5} step={0.5} {...field} />}
        />
      </Box>
    </Stack>
  );
}
