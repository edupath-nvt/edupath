import dayjs from 'dayjs';
import { useState, useEffect } from 'react';

import { Box } from '@mui/system';
import { Button, Divider } from '@mui/material';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';

import { t } from 'src/i18n';
import { db } from 'src/database/dexie';

import { Center } from 'src/components/views/center';

import { form, useDialogAddSchedule } from '../dialog/dialog-add-schedule';

export function ViewMonth() {
  const { setOpen } = useDialogAddSchedule();
  const [today, setToday] = useState<Dayjs>(dayjs());
  const [schedules, setSchedules] = useState<Record<string, Schedule[]>>({});

  useEffect(() => {
    db.schedules.toArray().then((res) =>
      setSchedules(
        res.reduce(
          (p, c) => ({
            ...p,
            [dayjs(c.timeHandle).format('YYYY-MM-DD')]: [
              ...(p[dayjs(c.timeHandle).format('YYYY-MM-DD')] || []),
              c,
            ],
          }),
          {} as Record<string, Schedule[]>
        )
      )
    );
  }, []);

  useEffect(() => {
    const idInterval = setInterval(() => {
      setToday(dayjs());
    }, 5_000);
    return () => clearInterval(idInterval);
  }, []);

  return (
    <Center sx={{ border: 1, borderRadius: 1, borderColor: 'divider', flexDirection: 'column' }}>
      <Center py={1}>
        <Button variant="outlined" onClick={() => setToday(dayjs())}>
          {t('Month today')}
        </Button>
      </Center>
      <Divider />
      <DateCalendar
        dayOfWeekFormatter={(d) => {
          const map = {
            Su: 'CN',
            Mo: 'T2',
            Tu: 'T3',
            We: 'T4',
            Th: 'T5',
            Fr: 'T6',
            Sa: 'T7',
          };
          return map[d.format('dd') as keyof typeof map] || d.format('dd');
        }}
        views={['month', 'day']}
        value={today}
        onChange={(newValue) => {
          if (!newValue) return;
          form.setValue('day', newValue);
          form.setValue('time', dayjs(newValue).hour(20).minute(0));
          setOpen(true);
        }}
        slots={{
          day: (props) => {
            const dateStr = props.day.format('YYYY-MM-DD');
            const hasSchedule = !!schedules[dateStr];
            if (!hasSchedule) return <PickersDay {...props} />;
            return (
              <Box
                sx={{
                  position: 'relative',
                  '&::after': {
                    position: 'absolute',
                    content: '""',
                    right: 0,
                    height: 8,
                    width: 8,
                    bgcolor: 'error.main',
                    borderRadius: 1,
                  },
                }}
              >
                <PickersDay {...props} />
              </Box>
            );
          },
        }}
      />
    </Center>
  );
}
