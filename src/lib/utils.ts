import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parse, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
}

export function formatDate(date: string | Date, formatStr: string = 'dd/MM/yyyy') {
  if (!date) return '';
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

export function formatTime(time: string) {
  if (!time) return '';
  try {
    const parsedTime = parse(time, 'HH:mm', new Date());
    return format(parsedTime, 'h:mm a');
  } catch (error) {
    console.error('Error formatting time:', error);
    return time;
  }
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export function generateTimeSlots(start = 9, end = 18, interval = 30) {
  const slots = [];
  for (let hour = start; hour < end; hour++) {
    for (let minute = 0; minute < 60; minute += interval) {
      const formattedHour = hour.toString().padStart(2, '0');
      const formattedMinute = minute.toString().padStart(2, '0');
      slots.push(`${formattedHour}:${formattedMinute}`);
    }
  }
  return slots;
}