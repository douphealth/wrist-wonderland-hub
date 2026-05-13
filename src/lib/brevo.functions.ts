import { createServerFn } from "@tanstack/react-start";
import { brevoSubscribeSchema, runBrevoSubscribe } from "./brevo-core.server";

export type SubscribeInput = import("./brevo-core.server").BrevoSubscribeInput;

export const subscribeLead = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => brevoSubscribeSchema.parse(input))
  .handler(async ({ data }) => {
    return await runBrevoSubscribe(data);
  });
