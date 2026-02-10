/**
 * Template Store - Zustand
 *
 * Manages workout templates for quick workout creation.
 */

import { create } from 'zustand';
import { WorkoutTemplate } from '../types';
import {
  getTemplates,
  saveTemplate as saveTemplateToStorage,
  deleteTemplate as deleteTemplateFromStorage,
} from '../services/storage';
import { useAuthStore } from './authStore';
import { logError } from '../utils/logger';

// Helper to get current userId from auth store
const getUserId = (): string | null => {
  const { user } = useAuthStore.getState();
  return user?.id ?? null;
};

interface TemplateState {
  // State
  templates: WorkoutTemplate[];
  templatesLoaded: boolean;
  isLoading: boolean;

  // Actions
  fetchTemplates: () => Promise<void>;
  addTemplate: (template: WorkoutTemplate) => Promise<void>;
  deleteTemplate: (templateId: string) => Promise<void>;
  invalidateCache: () => void;
}

export const useTemplateStore = create<TemplateState>((set, get) => ({
  // Initial state
  templates: [],
  templatesLoaded: false,
  isLoading: false,

  fetchTemplates: async () => {
    const userId = getUserId();
    if (!userId) return;
    if (get().templatesLoaded) return;

    set({ isLoading: true });
    try {
      const templates = await getTemplates(userId);
      set({ templates, templatesLoaded: true });
    } catch (error) {
      logError('Failed to fetch templates', error);
    } finally {
      set({ isLoading: false });
    }
  },

  addTemplate: async (template: WorkoutTemplate) => {
    await saveTemplateToStorage(template);
    const { templates } = get();
    set({ templates: [template, ...templates] });
  },

  deleteTemplate: async (templateId: string) => {
    await deleteTemplateFromStorage(templateId);
    const { templates } = get();
    set({ templates: templates.filter((t) => t.id !== templateId) });
  },

  invalidateCache: () => {
    set({ templatesLoaded: false });
  },
}));
