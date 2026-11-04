/**
 * Penpot API Types
 * Based on Penpot's RPC API structure
 */

export interface PenpotConfig {
  apiUrl: string;
  accessToken: string;
}

// Base API Response
export interface PenpotResponse<T = unknown> {
  success: boolean;
  result?: T;
  error?: {
    type: string;
    message: string;
    code?: string;
  };
}

// Project & Team Types
export interface PenpotProject {
  id: string;
  name: string;
  teamId: string;
  createdAt: string;
  modifiedAt: string;
  isDefault?: boolean;
}

export interface PenpotTeam {
  id: string;
  name: string;
  isDefault?: boolean;
}

// File Types
export interface PenpotFile {
  id: string;
  name: string;
  projectId: string;
  revn: number;
  version: number;
  createdAt: string;
  modifiedAt: string;
  data?: PenpotFileData;
  pages?: PenpotPage[];
}

export interface PenpotFileData {
  id: string;
  name: string;
  pages: string[]; // page IDs
  pagesIndex: Record<string, PenpotPage>;
}

// Page Types
export interface PenpotPage {
  id: string;
  name: string;
  objects: Record<string, PenpotShape>;
  options?: Record<string, unknown>;
}

// Shape/Object Types
export type ShapeType =
  | 'frame'
  | 'rect'
  | 'circle'
  | 'path'
  | 'text'
  | 'image'
  | 'svg-raw'
  | 'group'
  | 'bool';

export interface PenpotShape {
  id: string;
  type: ShapeType;
  name: string;
  pageId?: string;
  parentId?: string;
  frameId?: string;

  // Position & Size
  x?: number;
  y?: number;
  width?: number;
  height?: number;

  // Transform
  transform?: number[]; // 6-element transform matrix
  transformInverse?: number[];
  rotation?: number;

  // Geometry
  points?: number[][]; // Corner points
  selrect?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  // Visual Properties
  fills?: PenpotFill[];
  strokes?: PenpotStroke[];
  opacity?: number;
  blendMode?: string;

  // Children (for frames and groups)
  shapes?: string[]; // child shape IDs

  // Type-specific properties
  content?: string; // for text
  svgAttrs?: {
    raw?: string;
    [key: string]: unknown;
  }; // for svg-raw

  // Display options
  hidden?: boolean;
  blocked?: boolean;
  hideInViewer?: boolean;
  hideFillOnExport?: boolean;
  showContent?: boolean;

  // Layout
  layout?: unknown;
  layoutChild?: unknown;

  // Component
  componentId?: string;
  componentFile?: string;
  componentRoot?: boolean;
  shapeRef?: string;
}

// Fill Types
export interface PenpotFill {
  fillColor?: string;
  fillOpacity?: number;
  fillColorGradient?: unknown;
  fillColorRefId?: string;
  fillColorRefFile?: string;
}

// Stroke Types
export interface PenpotStroke {
  strokeColor?: string;
  strokeOpacity?: number;
  strokeStyle?: 'solid' | 'dotted' | 'dashed' | 'mixed' | 'none' | 'svg';
  strokeWidth?: number;
  strokeAlignment?: 'center' | 'inner' | 'outer';
  strokeCapStart?: string;
  strokeCapEnd?: string;
  strokeColorRefId?: string;
  strokeColorRefFile?: string;
  strokeColorGradient?: unknown;
}

// Change Types for update-file
export type ChangeType =
  | 'add-page'
  | 'mod-page'
  | 'del-page'
  | 'add-obj'
  | 'mod-obj'
  | 'del-obj'
  | 'mov-objects'
  | 'add-component'
  | 'mod-component'
  | 'del-component';

export interface BaseChange {
  type: ChangeType;
}

export interface AddPageChange extends BaseChange {
  type: 'add-page';
  id?: string;
  name?: string;
}

export interface AddObjChange extends BaseChange {
  type: 'add-obj';
  id: string;
  pageId: string;
  frameId: string;
  parentId?: string;
  obj: Partial<PenpotShape>;
}

export interface ModObjChange extends BaseChange {
  type: 'mod-obj';
  id: string;
  pageId: string;
  operations: ModOperation[];
}

export interface DelObjChange extends BaseChange {
  type: 'del-obj';
  id: string;
  pageId: string;
}

export interface ModOperation {
  type: 'set' | 'assign';
  attr?: string;
  val?: unknown;
  value?: unknown;
}

// Update File Request
export interface UpdateFileRequest {
  id: string;
  sessionId: string;
  revn: number;
  changes: BaseChange[];
}

// Create File Request
export interface CreateFileRequest {
  projectId: string;
  name: string;
  isShared?: boolean;
}
