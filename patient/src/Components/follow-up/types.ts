export interface Visit {
  date: Date;
  treatment: string;
  summary: string;
  fullDetailsLink: string;
}

export interface Doctor {
  id: number;
  name: string;
  specialty: string;
  photoUrl: string;
  clinicId: string;
  lastVisit: Visit;
}