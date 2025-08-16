import { create } from "zustand";
import { listCharacters } from "../api/characters";
import { makeTurnOrder, resolveCombat } from "../api/combat";

// --- helpers to normalize various API shapes ---
const pick = (...paths) => (obj) => {
  for (const p of paths) {
    const segs = Array.isArray(p) ? p : p.split(".");
    let cur = obj;
    let ok = true;
    for (const s of segs) {
      cur = cur?.[s];
      if (cur === undefined) { ok = false; break; }
    }
    if (ok) return cur;
  }
  return undefined;
};

const getErrorMessage = (err) =>
  err?.response?.data?.message ||
  err?.data?.message ||
  err?.message ||
  "Unexpected error";

export const useArena = create((set, get) => ({
  characters: [],
  turnOrder: [],
  loading: false,
  clashResult: null,
  error: null,

  // Load characters (pagination supported in wrapper)
  loadCharacters: async (opts = { limit: 100, page: 1 }) => {
    set({ loading: true, error: null });
    try {
      const res = await listCharacters(opts);
      // Accept any of: {data:[...]}, {data:{data:[...]}}, or full array
      const extract = pick("data.data", "data.docs", "data", "docs");
      const list = extract(res) ?? [];
      set({ characters: Array.isArray(list) ? list : [], error: null });
      return list;
    } catch (error) {
      const msg = getErrorMessage(error);
      console.error("Failed to load characters:", error);
      set({ error: msg });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  // Turn order
  computeTurnOrder: async (participants) => {
    set({ loading: true, error: null });
    try {
      const res = await makeTurnOrder(participants);
      const extract = pick("data.turnOrder", "turnOrder");
      const order = extract(res) ?? [];
      set({ turnOrder: Array.isArray(order) ? order : [] });
      return order;
    } catch (error) {
      const msg = getErrorMessage(error);
      console.error("Failed to compute turn order:", error);
      set({ error: msg });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  // Resolve clash / direct attack
  doClash: async (payload) => {
    set({ loading: true, clashResult: null, error: null });
    try {
      // payload must be: { attackerId, defenderId, attackerSkillId, defenderSkillId? }
      const res = await resolveCombat(payload);

      // Accept: {result:{...}} or {data:{result:{...}}}
      const extract = pick("data.result", "result", "data");
      const result = extract(res);

      if (!result) {
        throw new Error("No result returned from server");
      }

      // Store result for the modal
      set({ clashResult: result });

      // Refresh list so HP reflects changes (non-blocking)
      try {
        await get().loadCharacters({ limit: 100, page: 1 });
      } catch (e) {
        console.warn("Characters refresh after clash failed:", e);
      }

      return result;
    } catch (error) {
      const msg = getErrorMessage(error);
      console.error("Clash failed:", error);
      set({ error: msg });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  clearClashResult: () => set({ clashResult: null }),
}));
