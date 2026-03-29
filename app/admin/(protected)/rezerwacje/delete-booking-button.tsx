"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, LoaderCircle, Trash2 } from "lucide-react";

import { deleteBookingAction } from "@/app/admin/actions";
import {
  initialAdminActionState,
  type AdminActionState,
} from "@/app/admin/action-state";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-11 w-full items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-4 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <>
          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          Usuwanie...
        </>
      ) : (
        <>
          <Trash2 className="mr-2 h-4 w-4" />
          Usuń całkowicie
        </>
      )}
    </button>
  );
}

function ErrorNotice({ state }: { state: AdminActionState }) {
  if (state.status !== "error" || !state.message) {
    return null;
  }

  return (
    <p className="mt-2 inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <AlertCircle className="h-4 w-4 shrink-0" />
      <span>{state.message}</span>
    </p>
  );
}

export function DeleteBookingButton({
  bookingId,
  appointmentDate,
  appointmentTime,
  serviceName,
}: {
  bookingId: string;
  appointmentDate: string;
  appointmentTime: string;
  serviceName: string;
}) {
  const [state, formAction] = useActionState(
    deleteBookingAction,
    initialAdminActionState,
  );

  return (
    <>
      <form
        action={formAction}
        onSubmit={(event) => {
          const confirmed = window.confirm(
            `Usunąć rezerwację „${serviceName}” z ${appointmentDate} o ${appointmentTime}?`,
          );

          if (!confirmed) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="bookingId" value={bookingId} />
        <SubmitButton />
      </form>
      <ErrorNotice state={state} />
    </>
  );
}
