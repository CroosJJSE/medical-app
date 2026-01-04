// src/pages/patient/Timeline.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Loading from '@/components/common/Loading';
import timelineService from '@/services/timelineService';
import type { Timeline, TimelineEvent } from '@/models/Timeline';
import { TimelineEventType, TIMELINE_COLORS } from '@/enums';

const Timeline: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TimelineEventType | 'all'>('all');

  useEffect(() => {
    const loadTimeline = async () => {
      if (!user?.userId) return;
      
      try {
        const data = await timelineService.getTimeline(user.userId);
        setTimeline(data);
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

        {/* Timeline */}
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

