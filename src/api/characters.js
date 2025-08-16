import { api } from "./client";

export const listCharacters = (params={ page:1, limit:10 }) =>
  api.get("/characters", { params }).then(r => r.data);

export const getCharacter = id =>
  api.get(`/characters/${id}`).then(r => r.data);

export const createCharacter = payload =>
  api.post("/characters", payload).then(r => r.data);

export const updateCharacter = (id, payload) =>
  api.put(`/characters/${id}`, payload).then(r => r.data);

export const deleteCharacter = id =>
  api.delete(`/characters/${id}`).then(r => r.data);
