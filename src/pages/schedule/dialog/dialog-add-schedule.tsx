import dayjs from 'dayjs';
import Color from 'color';
import { create } from 'zustand';
import { useSearchParams } from 'react-router-dom';
import { useRef, useState, useEffect } from 'react';
import { useFormState, createFormControl } from 'react-hook-form';

import { Stack } from '@mui/system';
import {
  Tab,
  Tabs,
  List,
  Chip,
  Button,
  Dialog,
  Avatar,
  Switch,
  ListItem,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
} from '@mui/material';

import { useRouter } from 'src/routes/hooks';

import { t } from 'src/i18n';
import { db } from 'src/database/dexie';
import { Exams, Subjects } from 'src/mock/default-data';

import { toast } from 'src/components/toast';
import { Row } from 'src/components/views/row';
import { Iconify } from 'src/components/iconify';
import { dialog } from 'src/components/dialog-confirm/confirm';

import { ViewTabMe } from '../components/view-tab-me';
import { ViewTabSubject } from '../components/view-tab-subject';
import { Schedule, saveNotification } from '../utils/save-notification';
import { checkScheduleConflict, hasOverlappingSchedule } from '../utils/has-overlapping-schedule';

export const useDialogAddSchedule = create<DialogProps>((set) => ({
  open: false,
  setOpen: (open: boolean) => set({ open }),
}));

export const form = createFormControl<
  Schedule & {
    day: Dayjs;
    time: Dayjs;
  }
>();

export function DialogAddSchedule() {
  const { open, setOpen } = useDialogAddSchedule();
  const [search, setSearch] = useSearchParams();
  const [show, setShow] = useState<boolean[]>([]);
  const [lst, setLst] = useState<Schedule[]>([]);
  const defShow = useRef<boolean[]>([]);
  const back = search.get('back');
  const tab = search.get('tab') || 'subject';
  const setTab = (_tab: string) => {
    if (_tab === 'subject') {
      search.delete('tab');
    } else search.set('tab', _tab);
    setSearch(search);
  };
  const router = useRouter();

  const { isLoading } = useFormState(form);
  const handleAddSchedule = form.handleSubmit(async (data) => {
    const start = dayjs();
    const end = dayjs(data.day);
    const days = end.diff(start, 'day') + 1;
    if (tab === 'subject') {
      const lstSchedule: Schedule[] = Array.from({ length: days }, (_, i) => ({
        exam: data.exam,
        subject: data.subject,
        timeHandle: start
          .add(i, 'day')
          .set('hour', data.time.hour())
          .set('minute', data.time.minute())
          .toDate(),
        studyTime: data.studyTime,
        status: 'new',
        type: 'subject',
      }));

      if (lstSchedule.length > 0 && dayjs(lstSchedule[0].timeHandle).isBefore(dayjs())) {
        lstSchedule.shift();
      }

      const hasConflict = await hasOverlappingSchedule(lstSchedule);
      if (hasConflict.filter(Boolean).length > 0) {
        setLst(lstSchedule);
        setShow(hasConflict);
        defShow.current = hasConflict;
        return;
      }

      dialog.confirm(
        t(
          'Do you really want to add {{length}} study schedules every day at {{time}} for the {{subject}} subject?',
          {
            length: lstSchedule.length,
            time: data.time.format('HH:mm'),
            subject: data.subject,
          }
        ),
        async () => {
          const keys = await db.schedules.bulkAdd(lstSchedule, {
            allKeys: true,
          });
          await saveNotification(lstSchedule.map((s, i) => ({ ...s, id: keys[i] })));
          setOpen(false);
          if (back) router.push(back);
          toast.success(t('Add schedule successfully'));
        }
      );
    }
    if (tab === 'me') {
      const timeHanlde = data.day
        .set('hour', data.time.hour())
        .set('minute', data.time.minute())
        .toDate();

      const hasConflict = await checkScheduleConflict(timeHanlde, data.studyTime);
      if (hasConflict) {
        toast.error(t('There is a schedule conflict with existing study time.'));
        return;
      }

      const id = await db.schedules.add({
        title: data.title!,
        body: data.body || '',
        timeHandle: timeHanlde,
        studyTime: data.studyTime,
        status: 'new',
        type: 'self',
      });
      await Schedule({
        title: data.title!,
        body: data.body || '',
        at: dayjs(timeHanlde),
        id,
      });
      setOpen(false);
      if (back) router.push(back);
      toast.success(t('Add schedule successfully'));
    }
  });

  const handleAdd = form.handleSubmit(async (data) => {
    const lstSchedule = lst.filter((_, i) => !show[i]);
    dialog.confirm(
      t(
        'Do you really want to add {{length}} study schedules every day at {{time}} for the {{subject}} subject?',
        {
          length: lstSchedule.length,
          time: data.time.format('HH:mm'),
          subject: data.subject,
        }
      ),
      async () => {
        const keys = await db.schedules.bulkAdd(lstSchedule, {
          allKeys: true,
        });
        await saveNotification(lstSchedule.map((s, i) => ({ ...s, id: keys[i] })));
        setOpen(false);
        setShow([]);
        if (back) router.push(back);
        toast.success(t('Add schedule successfully'));
      }
    );
  });

  useEffect(() => {
    if (!open) {
      form.reset({});
    }
  }, [open]);

  return (
    <>
      <Dialog open={open} fullWidth maxWidth="xs">
        <DialogTitle>{t('Add schedule')}</DialogTitle>
        <DialogContent dividers>
          {!search.has('subject') && !search.has('exam') && (
            <Tabs
              sx={{ borderRadius: 1, mb: 2 }}
              type="button"
              value={tab}
              onChange={(_, tb) => setTab(tb)}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab
                iconPosition="start"
                icon={<Iconify icon="solar:calendar-add-bold" />}
                label={t('For subject')}
                value="subject"
              />
              <Tab
                iconPosition="start"
                icon={<Iconify icon="solar:user-plus-bold" />}
                label={t('For me')}
                value="me"
              />
            </Tabs>
          )}
          {tab === 'subject' && <ViewTabSubject control={form.control} />}
          {tab === 'me' && <ViewTabMe control={form.control} />}
        </DialogContent>
        <DialogActions>
          <Button
            disabled={isLoading}
            onClick={() => {
              if(back) router.replace(back);
              setOpen(false);
            }}
          >
            {t('Close')}
          </Button>
          <Button
            loading={isLoading}
            variant="contained"
            color="primary"
            startIcon={<Iconify icon="solar:calendar-bold" />}
            onClick={handleAddSchedule}
          >
            {t('Add schedule')}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={show?.length > 0} fullWidth maxWidth="xs">
        <DialogTitle>{t('Confirm schedule')}</DialogTitle>
        <DialogContent>
          {lst.length > 0 && (
            <Stack>
              <Row gap={2} mb={2}>
                <Avatar
                  sx={{
                    bgcolor: Subjects[lst[0].subject!].color,
                    color: (th) => th.palette.getContrastText(Subjects[lst[0].subject!].color),
                  }}
                >
                  <Iconify icon={Subjects[lst[0].subject!].icon as any} />
                </Avatar>
                <Stack>
                  <Typography variant="h6">{Subjects[lst[0].subject!].name}</Typography>
                  <Chip
                    size="small"
                    icon={<Iconify color="inherit" icon={Exams[lst[0].exam!].icon as any} />}
                    label={lst[0].exam!}
                    sx={{
                      width: 1,
                      justifyContent: 'flex-start',
                      color: Exams[lst[0].exam!].color,
                      bgcolor: Color(Exams[lst[0].exam!].color).alpha(0.08).toString(),
                      border: 1,
                      borderColor: Color(Exams[lst[0].exam!].color).alpha(0.16).toString(),
                    }}
                  />
                </Stack>
              </Row>
              <List>
                {lst.map((sch, index) => (
                  <ListItem key={index} disablePadding sx={{ gap: 1 }}>
                    <Switch
                      disabled={defShow.current[index]}
                      checked={!show[index]}
                      onChange={(_, val) => {
                        setShow((prev) => {
                          const newShow = [...prev];
                          newShow[index] = !val;
                          return newShow;
                        });
                      }}
                    />
                    <Typography
                      variant="subtitle2"
                      sx={{
                        textDecoration: show[index] ? 'line-through' : 'none',
                      }}
                    >
                      {dayjs(sch.timeHandle).format('DD/MM/YYYY HH:mm')}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            disabled={isLoading}
            onClick={() => {
              setShow([]);
            }}
          >
            {t('Close')}
          </Button>
          <Button
            loading={isLoading}
            disabled={show.filter((s) => !s).length === 0}
            variant="contained"
            color="primary"
            startIcon={<Iconify icon="solar:calendar-bold" />}
            onClick={handleAdd}
          >
            {t('Add schedule')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
