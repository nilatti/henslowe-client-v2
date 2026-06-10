import { useState } from "react";
import { useBuildRehearsalSchedule } from "../api/rehearsals";
import { Button, Card } from "../../../components/ui";
import { DAYS_OF_WEEK } from "../../../utils/constants";
import type { RehearsalUser } from "../types/rehearsal";
import RehearsalCallSelector from "./people/RehearsalCallSelector";

interface RehearsalPatternCreatorProps {
  productionId: number;
  actors: RehearsalUser[];
  productionStaff: RehearsalUser[];
  onClose: () => void;
  actorCharacterNames?: Map<number, string[]>;
}

export function RehearsalPatternCreator({
  productionId,
  actors,
  productionStaff,
  onClose,
  actorCharacterNames,
}: RehearsalPatternCreatorProps) {
  const buildSchedule = useBuildRehearsalSchedule(productionId);
  const [submitted, setSubmitted] = useState(false);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>([]);
  const [breakLength, setBreakLength] = useState("");
  const [timeBetweenBreaks, setTimeBetweenBreaks] = useState("");
  const [defaultUserIds, setDefaultUserIds] = useState<number[]>([]);

  const blockLength =
    (parseInt(timeBetweenBreaks) || 0) + (parseInt(breakLength) || 0);

  const toggleDay = (day: string) => {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const toggleUser = (userId: number) => {
    setDefaultUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleSubmit = async () => {
    await buildSchedule.mutateAsync({
      days_of_week: daysOfWeek,
      start_date: startDate,
      end_date: endDate,
      start_time: startTime,
      end_time: endTime,
      block_length: blockLength,
      break_length: parseInt(breakLength) || 0,
      time_between_breaks: parseInt(timeBetweenBreaks) || 0,
      default_user_ids: defaultUserIds,
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <Card className="p-6">
        <p className="text-sm text-gray-700 mb-2">
          Rehearsal schedule is being built. This may take a few minutes.
        </p>
        <p className="text-xs text-gray-500 mb-4">
          Come back in about 5 minutes and refresh the page to see your
          rehearsals.
        </p>
        <Button onClick={onClose}>Close</Button>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-1">
        Rehearsal Pattern Generator
      </h3>
      <p className="text-xs text-gray-500 italic mb-4">
        Generate a block of rehearsals from a repeating pattern. Run this
        multiple times for different schedule blocks (e.g. regular rehearsals vs
        tech week).
      </p>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start time
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End time
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rehearse on these days
          </label>
          <div className="flex flex-wrap gap-3">
            {DAYS_OF_WEEK.map((day) => (
              <label
                key={day}
                className="flex items-center gap-1 text-sm text-gray-700"
              >
                <input
                  type="checkbox"
                  checked={daysOfWeek.includes(day)}
                  onChange={() => toggleDay(day)}
                  className="rounded border-gray-300"
                />
                <span className="capitalize">{day}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Work time per block (min)
            </label>
            <input
              type="number"
              value={timeBetweenBreaks}
              onChange={(e) => setTimeBetweenBreaks(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Break length (min)
            </label>
            <input
              type="number"
              value={breakLength}
              onChange={(e) => setBreakLength(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total block (min)
            </label>
            <input
              type="number"
              value={blockLength}
              disabled
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-gray-50"
            />
          </div>
        </div>

        {actors.length > 0 ||
          (productionStaff.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Always call these people
              </label>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                <RehearsalCallSelector
                  actors={actors}
                  productionStaff={productionStaff}
                  selectedIds={defaultUserIds}
                  handleToggle={toggleUser}
                  actorCharacterNames={actorCharacterNames}
                />
              </div>
            </div>
          ))}
      </div>

      <div className="flex gap-2 mt-6">
        <Button
          onClick={handleSubmit}
          disabled={
            !startDate ||
            !endDate ||
            !startTime ||
            !endTime ||
            daysOfWeek.length === 0 ||
            buildSchedule.isPending
          }
        >
          {buildSchedule.isPending ? "Submitting..." : "Generate rehearsals"}
        </Button>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Card>
  );
}
