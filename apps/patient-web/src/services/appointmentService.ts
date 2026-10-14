import { Appointment } from '../types';
import { api, ApiAppointment } from './api';
import { storageService } from './storageService';

export function toAppointment(a: ApiAppointment): Appointment {
  const start = new Date(a.slot.start);
  return {
    id: String(a.id),
    hospitalId: String(a.facility.id),
    hospitalName: a.hospital_label || a.facility.name,
    department: a.doctor.department,
    doctorName: a.doctor.name,
    date: start.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }),
    timeSlot: start.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }).toUpperCase(),
    patientName: a.patient.name || '',
    patientPhone: a.patient.phone,
    status: a.status,
    referenceCode: `HS-${a.id}`,
  };
}

export const appointmentService = {
  /** Reload this patient's appointments from the server into the local cache. */
  async refresh(phone: string): Promise<Appointment[]> {
    const list = (await api.patientAppointments(phone)).map(toAppointment);
    storageService.setAppointments(list);
    return list;
  },

  remember(appointment: Appointment): void {
    const rest = storageService.getAppointments().filter((a) => a.id !== appointment.id);
    storageService.setAppointments([appointment, ...rest]);
  },

  async cancel(id: string): Promise<void> {
    const updated = toAppointment(await api.cancel(Number(id)));
    appointmentService.remember(updated);
  },
};
