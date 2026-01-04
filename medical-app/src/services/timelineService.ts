// src/services/timelineService.ts

import type { Timeline, TimelineEvent } from '@/models/Timeline';
import { TIMELINE_COLORS, ID_PREFIXES, TimelineEventType } from '@/enums';
import { getByPatientId, create, update } from '@/repositories/timelineRepository';
import { generateId } from '@/utils/idGenerator';

/**
 * Get timeline for a patient
 * @param patientId - Patient ID
 * @returns Timeline or null
 */
export const getTimeline = async (patientId: string): Promise<Timeline | null> => {
  const timeline = await getByPatientId(patientId);
  return timeline;
};

/**
 * Add an event to a patient's timeline
 * @param patientId - Patient ID
 * @param event - TimelineEvent data
 */
export const addEvent = async (patientId: string, event: Omit<TimelineEvent, 'eventId' | 'color'>): Promise<void> => {
  let timeline = await getTimeline(patientId);

  const newEvent: TimelineEvent = {
    ...event,
    eventId: generateId(ID_PREFIXES.TIMELINE),
    color: TIMELINE_COLORS[event.eventType] || '#000000',
  };

  if (!timeline) {
    timeline = {
      timelineId: generateId(ID_PREFIXES.TIMELINE),
      patientId,
      events: [newEvent],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await create(timeline.timelineId, patientId, timeline);
  } else {
    timeline.events.push(newEvent);
    timeline.updatedAt = new Date();
    await update(patientId, timeline);
  }
};

/**
 * Update timeline (e.g., after bulk changes)
 * @param patientId - Patient ID
 */
export const updateTimeline = async (patientId: string): Promise<void> => {
  const timeline = await getTimeline(patientId);
  if (!timeline) return;
  timeline.updatedAt = new Date();
  await update(patientId, timeline);
};

/**
 * Get events by type
 * @param patientId - Patient ID
 * @param eventType - TimelineEventType
 * @returns Array of TimelineEvents
 */
export const getEventsByType = async (
  patientId: string,
  eventType: TimelineEventType
): Promise<TimelineEvent[]> => {
  const timeline = await getTimeline(patientId);
  if (!timeline) return [];
  return timeline.events.filter(event => event.eventType === eventType);
};

/**
 * Get events within a date range
 * @param patientId - Patient ID
 * @param startDate - Start Date
 * @param endDate - End Date
 * @returns Array of TimelineEvents
 */
export const getEventsByDateRange = async (
  patientId: string,
  startDate: Date,
  endDate: Date
): Promise<TimelineEvent[]> => {
  const timeline = await getTimeline(patientId);
  if (!timeline) return [];
  return timeline.events.filter(event => event.date >= startDate && event.date <= endDate);
};

/**
 * Auto-update timeline helper
 * Call this when new encounter/appointment/testResult/medication is created
 */
export const autoUpdateTimeline = async (
  patientId: string,
  event: Omit<TimelineEvent, 'eventId' | 'color'>
): Promise<void> => {
  await addEvent(patientId, event);
};

// Default export
const timelineService = {
  getTimeline,
  addEvent,
  updateTimeline,
  getEventsByType,
  getEventsByDateRange,
  autoUpdateTimeline,
};

export default timelineService;
