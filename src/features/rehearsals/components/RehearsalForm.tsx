import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useCreateRehearsal, useUpdateRehearsal } from "../api/rehearsals";
import type { RehearsalWithDetails } from "../types/rehearsal";
import { theaterSkeletonQueryOptions } from "../../theaters/api/theaters";
import { Button } from "../../../components/ui";

interface RehearsalFormProps {
  productionId: number;
  theaterId: number;
  rehearsal?: RehearsalWithDetails;
  onSuccess: () => void;
  onCancel: () => void;
}

function toLocalInput(iso: string) {
  return format(new Date(iso), "yyyy-MM-dd'T'HH:mm");
}

export function RehearsalForm({
  productionId,
  theaterId,
  rehearsal,
  onSuccess,
  onCancel,
}: RehearsalFormProps) {
  const create = useCreateRehearsal(productionId);
  const update = useUpdateRehearsal(productionId);
  const isEditing = !!rehearsal;
  const { data: theater } = useQuery(theaterSkeletonQueryOptions(theaterId));

  const now = format(new Date(), "yyyy-MM-dd'T'HH:mm");

  const form = useForm({
    defaultValues: {
      start_time: rehearsal?.start_time
        ? toLocalInput(rehearsal.start_time)
        : now,
      end_time: rehearsal?.end_time ? toLocalInput(rehearsal.end_time) : now,
      title: rehearsal?.title ?? "",
      notes: rehearsal?.notes ?? "",
      space_id: rehearsal?.space_id ?? null as number | null,
    },
    onSubmit: async ({ value }) => {
      const payload = {
        production_id: productionId,
        start_time: new Date(value.start_time).toISOString(),
        end_time: new Date(value.end_time).toISOString(),
        title: value.title || null,
        notes: value.notes || null,
        space_id: value.space_id,
      };
      if (isEditing) {
        await update.mutateAsync({ ...payload, id: rehearsal.id });
      } else {
        await create.mutateAsync(payload);
      }
      onSuccess();
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <form.Field name="start_time">
          {(field) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start time *
              </label>
              <input
                type="datetime-local"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </form.Field>

        <form.Field name="end_time">
          {(field) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End time *
              </label>
              <input
                type="datetime-local"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </form.Field>
      </div>

      <form.Field name="title">
        {(field) => (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              placeholder="e.g. Act 1 run"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </form.Field>

      <form.Field name="notes">
        {(field) => (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </form.Field>

      {theater && theater.spaces.length > 0 && (
        <form.Field name="space_id">
          {(field) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <select
                value={field.state.value ?? ""}
                onChange={(e) =>
                  field.handleChange(
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                onBlur={field.handleBlur}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No location</option>
                {theater.spaces.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </form.Field>
      )}

      <div className="flex gap-3 justify-end pt-2">
        <Button variant="secondary" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={form.state.isSubmitting}>
          {form.state.isSubmitting
            ? "Saving..."
            : isEditing
              ? "Save changes"
              : "Create rehearsal"}
        </Button>
      </div>
    </form>
  );
}
