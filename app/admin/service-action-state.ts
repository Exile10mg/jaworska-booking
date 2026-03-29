export type ServiceActionState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

export const initialServiceActionState: ServiceActionState = {
  status: "idle",
  message: null,
};
