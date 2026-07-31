import React from 'react';
import { CheckCircle2, CircleDot } from 'lucide-react';

const DisputeTimeline = ({ events = [], loading = false }) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-2xl bg-secondary" />
        ))}
      </div>
    );
  }

  if (!events.length) {
    return <p className="text-sm text-muted-foreground">No timeline events yet.</p>;
  }

  return (
    <ol className="space-y-0">
      {events.map((event, i) => (
        <li key={event.id || `${event.type}-${i}`} className="flex gap-3">
          <div className="flex flex-col items-center">
            {i === 0 ? (
              <CircleDot className="h-5 w-5 shrink-0 text-primary" />
            ) : (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
            )}
            {i < events.length - 1 && <span className="min-h-[1.5rem] w-px flex-1 bg-primary/40" />}
          </div>
          <div className="pb-5">
            <p className="text-sm font-semibold">{event.label}</p>
            {event.message && event.message !== event.label && (
              <p className="mt-0.5 text-xs text-muted-foreground">{event.message}</p>
            )}
            {event.createdAt && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {new Date(event.createdAt).toLocaleString()}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
};

export default DisputeTimeline;
