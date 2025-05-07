import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { PersonalityAttributes, TrainingScenario, ResponseTemplate } from './types/training.types';
import { trainingService } from './services/trainingService';

interface TrainingState {
  attributes: PersonalityAttributes;
  scenarios: TrainingScenario[];
  templates: ResponseTemplate[];
  loading: boolean;
  error: string | null;
}

const initialState: TrainingState = {
  attributes: {
    friendliness: 50,
    professionalism: 50,
    assertiveness: 50,
    empathy: 50
  },
  scenarios: [],
  templates: [],
  loading: false,
  error: null
};

export const saveAttributes = createAsyncThunk(
  'training/saveAttributes',
  async (attributes: PersonalityAttributes) => {
    const response = await trainingService.saveAttributes(attributes);
    return response;
  }
);

export const trainingSlice = createSlice({
  name: 'training',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(saveAttributes.pending, (state) => {
        state.loading = true;
      })
      .addCase(saveAttributes.fulfilled, (state, action) => {
        state.loading = false;
        state.attributes = action.payload;
      })
      .addCase(saveAttributes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'An error occurred';
      });
  }
});

export default trainingSlice.reducer;