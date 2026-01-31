/**
 * UI Store - Zustand
 *
 * Centralized state for modal visibility and UI interactions.
 * Eliminates scattered boolean states across screens.
 */

import { create } from 'zustand';
import { WorkoutLog, Meal, WorkoutTemplate } from '../types';

export type ModalType =
  | 'addWorkout'
  | 'editWorkout'
  | 'addMeal'
  | 'editMeal'
  | 'updateSteps'
  | 'updateWeight'
  | 'templatePicker'
  | 'confirmDialog'
  | 'welcome'
  | 'namePrompt';

export interface ConfirmDialogConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  icon?: string;
  iconColor?: string;
  onConfirm: () => void | Promise<void>;
}

interface UIState {
  // Modal visibility
  activeModal: ModalType | null;

  // Modal data
  editWorkoutData: WorkoutLog | null;
  editMealData: Meal | null;
  selectedTemplate: WorkoutTemplate | null;
  confirmDialogConfig: ConfirmDialogConfig | null;

  // Current date context (for modals that need it)
  currentDate: string;

  // Desktop master-detail selection
  selectedWorkoutId: string | null;
  selectedMealId: string | null;

  // Desktop sidebar state
  sidebarCollapsed: boolean;

  // Actions - Generic
  closeModal: () => void;
  closeAllModals: () => void;

  // Actions - Workout Modals
  openAddWorkout: (template?: WorkoutTemplate | null) => void;
  openEditWorkout: (workout: WorkoutLog) => void;
  openTemplatePicker: () => void;

  // Actions - Meal Modals
  openAddMeal: () => void;
  openEditMeal: (meal: Meal) => void;

  // Actions - Tracking Modals
  openUpdateSteps: () => void;
  openUpdateWeight: () => void;

  // Actions - Confirm Dialog
  openConfirmDialog: (config: ConfirmDialogConfig) => void;

  // Actions - Welcome Modal
  openWelcome: () => void;

  // Actions - Name Prompt Modal
  openNamePrompt: () => void;

  // Actions - Date
  setCurrentDate: (date: string) => void;

  // Actions - Desktop Selection
  selectWorkout: (workoutId: string | null) => void;
  selectMeal: (mealId: string | null) => void;

  // Actions - Desktop Sidebar
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  activeModal: null,
  editWorkoutData: null,
  editMealData: null,
  selectedTemplate: null,
  confirmDialogConfig: null,
  currentDate: new Date().toISOString().split('T')[0],
  selectedWorkoutId: null,
  selectedMealId: null,
  sidebarCollapsed: false,

  closeModal: () => {
    set({
      activeModal: null,
      editWorkoutData: null,
      editMealData: null,
      selectedTemplate: null,
      confirmDialogConfig: null,
    });
  },

  closeAllModals: () => {
    set({
      activeModal: null,
      editWorkoutData: null,
      editMealData: null,
      selectedTemplate: null,
      confirmDialogConfig: null,
    });
  },

  // Workout Modals
  openAddWorkout: (template = null) => {
    set({
      activeModal: 'addWorkout',
      selectedTemplate: template,
      editWorkoutData: null,
    });
  },

  openEditWorkout: (workout) => {
    set({
      activeModal: 'editWorkout',
      editWorkoutData: workout,
      selectedTemplate: null,
    });
  },

  openTemplatePicker: () => {
    set({
      activeModal: 'templatePicker',
    });
  },

  // Meal Modals
  openAddMeal: () => {
    set({
      activeModal: 'addMeal',
      editMealData: null,
    });
  },

  openEditMeal: (meal) => {
    set({
      activeModal: 'editMeal',
      editMealData: meal,
    });
  },

  // Tracking Modals
  openUpdateSteps: () => {
    set({
      activeModal: 'updateSteps',
    });
  },

  openUpdateWeight: () => {
    set({
      activeModal: 'updateWeight',
    });
  },

  // Confirm Dialog
  openConfirmDialog: (config) => {
    set({
      activeModal: 'confirmDialog',
      confirmDialogConfig: config,
    });
  },

  // Welcome Modal
  openWelcome: () => {
    set({
      activeModal: 'welcome',
    });
  },

  // Name Prompt Modal
  openNamePrompt: () => {
    set({
      activeModal: 'namePrompt',
    });
  },

  // Date
  setCurrentDate: (date) => {
    set({ currentDate: date });
  },

  // Desktop Selection
  selectWorkout: (workoutId) => {
    set({ selectedWorkoutId: workoutId });
  },

  selectMeal: (mealId) => {
    set({ selectedMealId: mealId });
  },

  // Desktop Sidebar
  toggleSidebar: () => {
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
  },

  setSidebarCollapsed: (collapsed) => {
    set({ sidebarCollapsed: collapsed });
  },
}));
