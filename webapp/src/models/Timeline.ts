// src/models/Timeline.ts

import { TimelineEventType, TIMELINE_COLORS } from '@/enums';

export interface TimelineEvent {
  eventId: string;

  eventType: TimelineEventType;
  date: Date;
  title: string;
  description?: string;

  eventData?: {
    appointmentId?: string;
    encounterId?: string;
    testResultId?: string;
    medicationId?: string;
    symptom?: string;
  };

  color?: string; // default can be set from TIMELINE_COLORS[eventType]
  icon?: string;  // optional icon identifier
}

export interface Timeline {
  timelineId: string;
  patientId: string;

  events: TimelineEvent[];

  createdAt: Date;
  updatedAt: Date;
}
