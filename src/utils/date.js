import dayjs from 'dayjs';
export const todayKey = () => dayjs().format('YYYY-MM-DD');
export const formatMoney = (value = 0) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(value || 0));
export const nowTime = () => dayjs().format('HH:mm');
