import { useSuspenseQuery } from "@tanstack/react-query";
import { playsQueryOptions } from "../api/plays";
import { type PlayListItem } from "../types/play";

export function PlaysPage() {
  const { data } = useSuspenseQuery(playsQueryOptions());

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Plays</h1>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
        {data.length === 0 && (
          <p className="px-4 py-3 text-sm text-gray-500">No plays found.</p>
        )}
        {data.map((play: PlayListItem) => (
          <div
            key={play.id}
            className="px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
          >
            {play.title}
          </div>
        ))}
      </div>
    </div>
  );
}
