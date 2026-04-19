// src/context/AlbumContext.tsx
import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import {
  AlbumProject, AlbumConfig, UploadedImage, AlbumPage,
  WorkflowStep, OccasionType, AlbumLayout
} from '../types';

interface AlbumState {
  project: AlbumProject;
  currentStep: WorkflowStep;
  isProcessing: boolean;
  processingProgress: number;
  processingStatus: string;
  error: string | null;
}

const defaultConfig: AlbumConfig = {
  occasion: 'family',
  eventTitle: '',
  stylePrompt: '',
  pageCount: 12,
  layout: 'modern',
  size: 'landscape',
  coverStyle: 'hardcover',
  paperFinish: 'glossy',
  colorTheme: '#D4A853',
  includeCaption: true,
  includeDateStamp: true,
  coverTitle: 'My Album',
};

const defaultProject: AlbumProject = {
  id: `proj_${Date.now()}`,
  config: defaultConfig,
  images: [],
  pages: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  status: 'draft',
};

const initialState: AlbumState = {
  project: defaultProject,
  currentStep: 'upload',
  isProcessing: false,
  processingProgress: 0,
  processingStatus: '',
  error: null,
};

type Action =
  | { type: 'ADD_IMAGES'; payload: UploadedImage[] }
  | { type: 'REMOVE_IMAGE'; payload: string }
  | { type: 'TOGGLE_IMAGE_SELECT'; payload: string }
  | { type: 'UPDATE_IMAGE'; payload: UploadedImage }
  | { type: 'SET_CONFIG'; payload: Partial<AlbumConfig> }
  | { type: 'SET_STEP'; payload: WorkflowStep }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_PROGRESS'; payload: { progress: number; status: string } }
  | { type: 'SET_PAGES'; payload: AlbumPage[] }
  | { type: 'UPDATE_PAGE'; payload: AlbumPage }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_PROJECT' };

function albumReducer(state: AlbumState, action: Action): AlbumState {
  switch (action.type) {
    case 'ADD_IMAGES':
      return {
        ...state,
        project: {
          ...state.project,
          images: [...state.project.images, ...action.payload],
          updatedAt: new Date(),
        },
      };
    case 'REMOVE_IMAGE':
      return {
        ...state,
        project: {
          ...state.project,
          images: state.project.images.filter(img => img.id !== action.payload),
          updatedAt: new Date(),
        },
      };
    case 'TOGGLE_IMAGE_SELECT':
      return {
        ...state,
        project: {
          ...state.project,
          images: state.project.images.map(img =>
            img.id === action.payload ? { ...img, selected: !img.selected } : img
          ),
          updatedAt: new Date(),
        },
      };
    case 'UPDATE_IMAGE':
      return {
        ...state,
        project: {
          ...state.project,
          images: state.project.images.map(img =>
            img.id === action.payload.id ? action.payload : img
          ),
          updatedAt: new Date(),
        },
      };
    case 'SET_CONFIG':
      return {
        ...state,
        project: {
          ...state.project,
          config: { ...state.project.config, ...action.payload },
          updatedAt: new Date(),
        },
      };
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    case 'SET_PROCESSING':
      return { ...state, isProcessing: action.payload };
    case 'SET_PROGRESS':
      return {
        ...state,
        processingProgress: action.payload.progress,
        processingStatus: action.payload.status,
      };
    case 'SET_PAGES':
      return {
        ...state,
        project: {
          ...state.project,
          pages: action.payload,
          status: 'complete',
          updatedAt: new Date(),
        },
      };
    case 'UPDATE_PAGE':
      return {
        ...state,
        project: {
          ...state.project,
          pages: state.project.pages.map(p =>
            p.id === action.payload.id ? action.payload : p
          ),
          updatedAt: new Date(),
        },
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'RESET_PROJECT':
      return {
        ...initialState,
        project: { ...defaultProject, id: `proj_${Date.now()}` },
      };
    default:
      return state;
  }
}

interface AlbumContextType {
  state: AlbumState;
  dispatch: React.Dispatch<Action>;
  addImages: (images: UploadedImage[]) => void;
  removeImage: (id: string) => void;
  toggleImageSelect: (id: string) => void;
  updateConfig: (config: Partial<AlbumConfig>) => void;
  setStep: (step: WorkflowStep) => void;
  setPages: (pages: AlbumPage[]) => void;
  updatePage: (page: AlbumPage) => void;
  setProcessing: (val: boolean) => void;
  setProgress: (progress: number, status: string) => void;
  setError: (err: string | null) => void;
  resetProject: () => void;
}

const AlbumContext = createContext<AlbumContextType | undefined>(undefined);

export function AlbumProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(albumReducer, initialState);

  const addImages = (images: UploadedImage[]) =>
    dispatch({ type: 'ADD_IMAGES', payload: images });
  const removeImage = (id: string) =>
    dispatch({ type: 'REMOVE_IMAGE', payload: id });
  const toggleImageSelect = (id: string) =>
    dispatch({ type: 'TOGGLE_IMAGE_SELECT', payload: id });
  const updateConfig = (config: Partial<AlbumConfig>) =>
    dispatch({ type: 'SET_CONFIG', payload: config });
  const setStep = (step: WorkflowStep) =>
    dispatch({ type: 'SET_STEP', payload: step });
  const setPages = (pages: AlbumPage[]) =>
    dispatch({ type: 'SET_PAGES', payload: pages });
  const updatePage = (page: AlbumPage) =>
    dispatch({ type: 'UPDATE_PAGE', payload: page });
  const setProcessing = (val: boolean) =>
    dispatch({ type: 'SET_PROCESSING', payload: val });
  const setProgress = (progress: number, status: string) =>
    dispatch({ type: 'SET_PROGRESS', payload: { progress, status } });
  const setError = (err: string | null) =>
    dispatch({ type: 'SET_ERROR', payload: err });
  const resetProject = () => dispatch({ type: 'RESET_PROJECT' });

  return (
    <AlbumContext.Provider
      value={{
        state, dispatch,
        addImages, removeImage, toggleImageSelect,
        updateConfig, setStep, setPages, updatePage,
        setProcessing, setProgress, setError, resetProject,
      }}
    >
      {children}
    </AlbumContext.Provider>
  );
}

export function useAlbum() {
  const ctx = useContext(AlbumContext);
  if (!ctx) throw new Error('useAlbum must be used within AlbumProvider');
  return ctx;
}
