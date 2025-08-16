import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  sanity: 0,
  skills: [],
  image: null,
};

const characterSlice = createSlice({
  name: 'character',
  initialState,
  reducers: {
    setSanity: (state, action) => {
      state.sanity = Math.max(-45, Math.min(45, action.payload));
    },
    setSkills: (state, action) => {
      state.skills = action.payload;
    },
    setImage: (state, action) => {
      state.image = action.payload;
    },
  },
});

export const { setSanity, setSkills, setImage } = characterSlice.actions;
export default characterSlice.reducer;
