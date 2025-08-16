import { api } from "./client";

export const makeTurnOrder = participants =>
  api.post("/combat/turn-order", { participants }).then(r => r.data);

export const resolveCombat = payload =>
  api.post("/combat/resolve", payload).then(r => r.data);
