import dayjs from 'dayjs';
import Color from 'color';
import { t } from 'i18next';
import { useMemo, useState, useEffect } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';

import { red } from '@mui/material/colors';
import {
  Box,
  Table,
  Stack,
  Badge,
  Button,
  Avatar,
  Tooltip,
  TableRow,
  Skeleton,
  TableHead,
  TableCell,
  TableBody,
  IconButton,
} from '@mui/material';

import { db } from 'src/database/dexie';
import { Exams, Subjects } from 'src/mock/default-data';

import { Iconify } from 'src/components/iconify';
import { Center } from 'src/components/views/center';
import { NoData } from 'src/components/grid-view/components/not-data';

import { saveNotification } from '../utils/save-notification';
import { useDialogAddSchedule } from '../dialog/dialog-add-schedule';

const days = [1, 2, 3, 4, 5, 6, 0];

function ViewDay({ d, start, today }: { d: number; start: dayjs.Dayjs; today: dayjs.Dayjs }) {
  const now = start.add(d === 0 ? 6 : d - 1, 'day');
  const label = d === 0 ? 'CN' : `T${d + 1}`;
  const isDay = today.isSame(now, 'day');
  return (
    <Stack alignItems="center" py={1}>
      <Center
        sx={{
          height: 24,
          width: 24,
          bgcolor: isDay ? 'primary.main' : 'unset',
          color: isDay ? 'primary.contrastText' : 'text.primary',
          borderRadius: 3,
        }}
      >
        {label}
      </Center>
      <Box fontSize={12} sx={{ opacity: 0.6 }}>
        {now.format('DD/MM')}
      </Box>
    </Stack>
  );
}

function GetScheduleInTime({
  d,
  start,
  today,
  hour,
  schedules,
  setSchedules,
}: {
  d: number;
  start: dayjs.Dayjs;
  today: dayjs.Dayjs;
  hour: number;
  schedules: Schedule[];
  setSchedules: React.Dispatch<React.SetStateAction<Schedule[]>>;
}) {
  const now = start.add(d === 0 ? 6 : d - 1, 'day');
  const schedule = schedules.find((s) => {
    const startTime = dayjs(s.timeHandle).hour();
    return dayjs(s.timeHandle).isSame(now, 'day') && startTime >= hour && startTime < hour + 1;
  });

  const Subject = schedule?.subject && Subjects[schedule.subject];
  if (!Subject) return <Box sx={{ height: 60, zIndex: 24 - hour }} />;
  const Exam = schedule?.exam && Exams[schedule.exam];
  const s = schedule!;

  const isActive =
    dayjs(s.timeHandle).isBefore(today) &&
    dayjs(s.timeHandle).add(s.studyTime, 'hour').isAfter(today);

  return (
    <Box
      sx={{
        height: 60,
        position: 'relative',
        zIndex: 24 - hour,
      }}
    >
      {schedule && Subject && (
        <Box sx={{ weight: 1, height: schedule.studyTime * 60, py: 1, px: 0.5 }}>
          <Center
            sx={{
              bgcolor: isActive ? 'none' : 'background.neutral',
              borderRadius: 1,
              height: 1,
              flexDirection: 'column',
              gap: 1,
            }}
          >
            {isActive && (
              <Skeleton
                variant="rectangular"
                animation="wave"
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: 1,
                  width: 1,
                  borderRadius: 1,
                }}
              />
            )}
            <Tooltip arrow title={Subject.name} placement="top">
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  <Center
                    sx={{
                      bgcolor: Exam?.color,
                      color: (th) => th.palette.getContrastText(Exam?.color || ''),
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      boxShadow: (th) => th.customShadows.z4,
                    }}
                  >
                    <Iconify width={0.7} icon={Exam?.icon as any} />
                  </Center>
                }
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: Subject.color,
                    color: (th) => th.palette.getContrastText(Subject.color),
                  }}
                >
                  <Iconify width={0.55} icon={Subject.icon as any} />
                </Avatar>
              </Badge>
            </Tooltip>
            {['new', 'canceled'].includes(s.status) && dayjs(s.timeHandle).isAfter(today) && (
              <IconButton
                size="small"
                onClick={() => {
                  db.schedules
                    .update(s.id!, { status: s.status === 'new' ? 'canceled' : 'new' })
                    .then(async () => {
                      if (s.status === 'new') {
                        await LocalNotifications.cancel({
                          notifications: [{ id: s.id! }],
                        });
                      } else {
                        await saveNotification([s]);
                      }
                      setSchedules((sch) =>
                        sch.map((e) => {
                          if (e.id === s.id)
                            return { ...e, status: e.status === 'new' ? 'canceled' : 'new' };
                          return e;
                        })
                      );
                    });
                }}
                sx={{
                  alignSelf: 'center',
                  position: 'relative',
                  bgcolor: 'divider',
                  ...(s.status === 'canceled' && {
                    color: red[600],
                    '&::after': {
                      content: '""',
                      height: 1.5,
                      bgcolor: red[400],
                      width: 0.6,
                      position: 'absolute',
                      rotate: '45deg',
                      borderRadius: 0.5,
                    },
                    bgcolor: Color(red[600]).alpha(0.08).hexa(),
                    '&:hover': {
                      bgcolor: Color(red[600]).alpha(0.16).hexa(),
                    },
                  }),
                }}
              >
                <Iconify icon="solar:bell-bing-bold-duotone" />
              </IconButton>
            )}
            {s.status === 'new' && isActive && (
              <Avatar sx={{ width: 36, height: 36, bgcolor: 'divider', color: 'text.primary' }}>
                <Iconify
                  sx={{
                    animation: 'spin 1.5s linear infinite',
                  }}
                  icon="mingcute:loading-fill"
                />
              </Avatar>
            )}
          </Center>
        </Box>
      )}
    </Box>
  );
}

export function ViewWeek() {
  const [day, setDay] = useState(dayjs());
  const [{ start, end }, setRange] = useState<{ start: Dayjs; end: Dayjs }>({
    start: dayjs().startOf('week'),
    end: dayjs().endOf('week'),
  });
  const [today, setToday] = useState(dayjs());
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  const { minTime, count } = useMemo(() => {
    if (!schedules?.length) return { minTime: 0, count: 0 };

    let min = dayjs(schedules[0].timeHandle);
    let max = dayjs(schedules[0].timeHandle).add(schedules[0].studyTime, 'hour');

    for (let i = 1; i < schedules.length; i++) {
      const s = schedules[i];
      const _start = dayjs(s.timeHandle);
      const _end = dayjs(s.timeHandle).add(s.studyTime, 'hour');

      if (_start.isBefore(min)) min = _start;
      if (_end.isAfter(max)) max = _end;
    }

    return {
      minTime: min.hour(),
      count: max.hour() - min.hour() + 1,
    };
  }, [schedules]);

  const { open } = useDialogAddSchedule();
  useEffect(() => {
    if (open === false)
      db.schedules
        .filter(
          (e) =>
            dayjs(e.timeHandle).isAfter(start.subtract(1, 'day')) &&
            dayjs(e.timeHandle).isBefore(end.add(1, 'day'))
        )
        .sortBy('timeHandle')
        .then(setSchedules);
  }, [end, open, start]);

  useEffect(() => {
    const idInterval = setInterval(() => {
      setToday(dayjs());
    }, 5_000);
    return () => clearInterval(idInterval);
  }, []);

  return (
    <Box border={1} borderColor="divider" borderRadius={1} overflow="hidden">
      <Box display="flex" alignItems="center" p={1}>
        <IconButton
          sx={{ borderRadius: 1 }}
          onClick={() => {
            setDay((d) => d.subtract(7, 'day'));
            setRange((pre) => ({
              start: pre.start.subtract(7, 'day'),
              end: pre.end.subtract(7, 'day'),
            }));
          }}
        >
          <Iconify sx={{ scale: -1 }} icon="eva:arrow-ios-forward-fill" />
        </IconButton>
        <Box justifyContent="center" flex={1} display="flex" alignItems="center" gap={1}>
          <Button
            size="small"
            variant="outlined"
            disabled={day.isSame(today, 'day')}
            onClick={() => {
              setDay(today);
              setRange({
                start: today.startOf('week'),
                end: today.endOf('week'),
              });
            }}
          >
            {t('Week today')}
          </Button>
        </Box>
        <IconButton
          sx={{ borderRadius: 1 }}
          onClick={() => {
            setDay((d) => d.add(7, 'day'));
            setRange((pre) => ({
              start: pre.start.add(7, 'day'),
              end: pre.end.add(7, 'day'),
            }));
          }}
        >
          <Iconify icon="eva:arrow-ios-forward-fill" />
        </IconButton>
      </Box>
      <Table padding="none">
        <TableHead>
          <TableRow>
            <TableCell width={40} />
            {days.map((d) => (
              <TableCell width={100} component="th" key={d} align="center">
                <ViewDay d={d} start={start} today={today} />
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {schedules.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} align="center" sx={{ p: 1 }}>
                <NoData />
              </TableCell>
            </TableRow>
          )}
          {Array.from({ length: count }).map((_, idx) => (
            <TableRow key={idx}>
              <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>
                {minTime + idx}h
              </TableCell>
              {days.map((d) => (
                <TableCell key={d} align="center">
                  <GetScheduleInTime
                    hour={minTime + idx}
                    d={d}
                    start={start}
                    today={today}
                    schedules={schedules}
                    setSchedules={setSchedules}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}
