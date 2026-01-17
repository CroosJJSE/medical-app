// src/pages/patient/Timeline.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Loading from '@/components/common/Loading';
import timelineService from '@/services/timelineService';
import encounterService from '@/services/encounterService';
import { convertToDate, formatDateLong } from '@/utils/formatters';
import type { Timeline, TimelineEvent } from '@/models/Timeline';
import type { Encounter } from '@/models/Encounter';
import { TimelineEventType, TIMELINE_COLORS } from '@/enums';

const Timeline: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TimelineEventType | 'all'>('all');

  useEffect(() => {
    const loadTimeline = async () => {
      const userId = user?.userID || user?.userId;
      if (!userId) return;
      
      try {
        const [data, encs] = await Promise.all([
          timelineService.getTimeline(userId),
          encounterService.getEncountersByPatient(userId),
        ]);
        setTimeline(data);
        setEncounters(encs);
      } catch (error) {
        console.error('Error loading timeline:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTimeline();
  }, [user]);

  const filteredEvents = timeline?.events.filter(event => 
    filter === 'all' || event.eventType === filter
  ) || [];

  const sortedEvents = [...filteredEvents].sort((a, b) => 
    b.date.getTime() - a.date.getTime()
  );

  const getEventColor = (eventType: TimelineEventType) => {
    const colorMap: Record<TimelineEventType, string> = TIMELINE_COLORS as any;
    return colorMap[eventType] || '#666';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size={48} message="Loading timeline..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Medical Timeline</h1>
          <Button variant="secondary" onClick={() => navigate('/patient/dashboard')}>
            Back to Dashboard
          </Button>
        </div>

        {/* Filter */}
        <Card>
          <div className="flex gap-4 flex-wrap">
            <Button
              variant={filter === 'all' ? 'primary' : 'secondary'}
              onClick={() => setFilter('all')}
            >
              All
            </Button>
                      {(Object.values(TimelineEventType) as TimelineEventType[]).map((type) => (
              <Button
                key={type}
                variant={filter === type ? 'primary' : 'secondary'}
                onClick={() => setFilter(type)}
              >
                {type.replace('_', ' ')}
              </Button>
            ))}
          </div>
        </Card>

        {/* Encounters Section */}
        {encounters.length > 0 && (
          <Card title={`Encounters (${encounters.length})`}>
            <div className="space-y-4">
              {encounters
                .sort((a, b) => {
                  const dateA = convertToDate(a.encounterDate) || new Date(0);
                  const dateB = convertToDate(b.encounterDate) || new Date(0);
                  return dateB.getTime() - dateA.getTime();
                })
                .map((encounter) => {
                  const encounterDate = convertToDate(encounter.encounterDate);
                  const createdDate = convertToDate(encounter.createdAt);
                  
                  return (
                    <div
                      key={encounter.encounterId}
                      className="border-l-4 border-purple-500 pl-4 py-3 bg-white rounded-r-lg shadow-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-purple-600 text-lg">medical_services</span>
                            <p className="font-semibold text-gray-900">
                              Medical Visit - {encounterDate ? formatDateLong(encounterDate) : 'Date not available'}
                            </p>
                          </div>
                          {encounter.subjective?.chiefComplaint && (
                            <p className="text-sm text-gray-700 mb-1">
                              <span className="font-medium">Chief Complaint:</span> {encounter.subjective.chiefComplaint}
                            </p>
                          )}
                          {encounter.assessment?.differentialDiagnosis && encounter.assessment.differentialDiagnosis.length > 0 && (
                            <p className="text-sm text-gray-700 mb-1">
                              <span className="font-medium">Diagnosis:</span> {encounter.assessment.differentialDiagnosis.join(', ')}
                            </p>
                          )}
                          {encounter.plan?.medications && encounter.plan.medications.length > 0 && (
                            <p className="text-sm text-gray-700 mb-1">
                              <span className="font-medium">Medications:</span> {encounter.plan.medications.length} prescribed
                            </p>
                          )}
                          {createdDate && (
                            <p className="text-xs text-gray-500 mt-2">
                              {createdDate.toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          )}
                        </div>
                        {encounter.prescriptionPdfUrl && (
                          <a
                            href={encounter.prescriptionPdfUrl}
                            download
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(encounter.prescriptionPdfUrl, '_blank');
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-sm ml-2"
                            title="Download Prescription PDF"
                          >
                            <span className="material-symbols-outlined text-sm">download</span>
                            <span>PDF</span>
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </Card>
        )}

        {/* Timeline Events */}
        <Card title={`Timeline Events (${sortedEvents.length})`}>
          {sortedEvents.length > 0 ? (
            <div className="space-y-4">
              {sortedEvents.map((event) => (
                <div
                  key={event.eventId}
                  className="border-l-4 pl-4 py-2"
                  style={{ borderColor: getEventColor(event.eventType) }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{event.title}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(event.date).toLocaleDateString()} at{' '}
                        {new Date(event.date).toLocaleTimeString()}
                      </p>
                      {event.description && (
                        <p className="text-gray-700 dark:text-gray-300 mt-1">{event.description}</p>
                      )}
                    </div>
                    <span
                      className="px-2 py-1 rounded text-xs"
                      style={{
                        backgroundColor: getEventColor(event.eventType) + '20',
                        color: getEventColor(event.eventType),
                      }}
                    >
                      {event.eventType.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No timeline events found</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Timeline;

