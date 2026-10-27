export type AuthActionState = { status: "idle" | "error" | "success"; message: string };
export type AuthAction = (state: AuthActionState, formData: FormData) => Promise<AuthActionState>;
export const initialAuthActionState: AuthActionState = { status: "idle", message: "" };
