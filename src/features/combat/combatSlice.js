import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  results: {}, // skillIndex: ["Heads", "Tails", ...]
};

const combatSlice = createSlice({
  name: 'combat',
  initialState,
  reducers: {
    setResult: (state, action) => {
      const { skillIndex, results } = action.payload;
      state.results[skillIndex] = results;
    },
  },
});

export const { setResult } = combatSlice.actions;
export default combatSlice.reducer;
