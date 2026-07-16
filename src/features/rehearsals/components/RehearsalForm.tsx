import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useCreateRehearsal, useUpdateRehearsal } from "../api/rehearsals";
import type { RehearsalWithDetails } from "../types/rehearsal";
import { theaterSkeletonQueryOptions } from "../../theaters/api/theaters";
import { FormField, FormActions, inputClass } from "../../../components/ui";

interface RehearsalFormProps {
  productionId: number;
  playId: number;
  theaterId: number;
  rehearsal?: RehearsalWithDetails;
  defaultSpaceId?: number | null;
  defaultStartTime?: string;
  defaultEndTime?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

function toLocalInput(iso: string) {
  return format(new Date(iso), "yyyy-MM-dd'T'HH:mm");
}

export function RehearsalForm({
  productionId,
  playId,
  theaterId,
  rehearsal,
  defaultSpaceId,
  defaultStartTime,
  defaultEndTime,
  onSuccess,
  onCancel,
}: RehearsalFormProps) {
  const create = useCreateRehearsal(productionId, playId);
  const update = useUpdateRehearsal(productionId, playId);
  const isEditing = !!rehearsal;
  const { data: theater } = useQuery(theaterSkeletonQueryOptions(theaterId));

  const now = format(new Date(), "yyyy-MM-dd'T'HH:mm");

  const form = useForm({
    defaultValues: {
      start_time: rehearsal?.start_time
        ? toLocalInput(rehearsal.start_time)
        : defaultStartTime ? toLocalInput(defaultStartTime) : now,
      end_time: rehearsal?.end_time
        ? toLocalInput(rehearsal.end_time)
        : defaultEndTime ? toLocalInput(defaultEndTime) : now,
      title: rehearsal?.title ?? "",
      notes: rehearsal?.notes ?? "",
      space_id: rehearsal?.space_id ?? defaultSpaceId ?? null as number | null,
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
            <FormField label="Start time" required>
              <input
                type="datetime-local"
                value={field.state.value}
                onChange={(e) => {
                  const val = e.target.value;
                  field.handleChange(val);
                  if (val > form.getFieldValue("end_time")) {
                    form.setFieldValue("end_time", val);
                  }
                }}
                onBlur={field.handleBlur}
                className={inputClass}
              />
            </FormField>
          )}
        </form.Field>

        <form.Field
          name="end_time"
          validators={{
            onChange: ({ value }) =>
              value < form.getFieldValue("start_time")
                ? "End time must be after start time"
                : undefined,
            onChangeListenTo: ["start_time"],
          }}
        >
          {(field) => (
            <FormField label="End time" required error={field.state.meta.errors[0] as string | undefined}>
              <input
                type="datetime-local"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${field.state.meta.errors.length ? "border-red-500" : "border-gray-300"}`}
              />
            </FormField>
          )}
        </form.Field>
      </div>

      <form.Field name="title">
        {(field) => (
          <FormField label="Title">
            <input
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              placeholder="e.g. Act 1 run"
              className={inputClass}
            />
          </FormField>
        )}
      </form.Field>

      <form.Field name="notes">
        {(field) => (
          <FormField label="Notes">
            <textarea
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              rows={3}
              className={inputClass}
            />
          </FormField>
        )}
      </form.Field>

      {theater && theater.spaces.length > 0 && (
        <form.Field name="space_id">
          {(field) => (
            <FormField label="Location">
              <select
                value={field.state.value ?? ""}
                onChange={(e) =>
                  field.handleChange(
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                onBlur={field.handleBlur}
                className={inputClass}
              >
                <option value="">No location</option>
                {theater.spaces.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </FormField>
          )}
        </form.Field>
      )}

      <FormActions isSubmitting={form.state.isSubmitting} isEditing={isEditing} onCancel={onCancel} submitLabel="Create rehearsal" />
    </form>
  );
}
