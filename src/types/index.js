/**
 * Zod schemas for runtime validation
 */
import { z } from 'zod';

// Document types
export const DocumentType = z.enum([
  'chapter',
  'scene',
  'character',
  'location',
  'theme',
  'narrative_spine',
  'style_guide',
  'story_compass',
  'emotional_arc',
  'note',
]);

// Document status
export const DocumentStatus = z.enum(['draft', 'revised', 'final']);

// Project schema
export const ProjectSchema = z.object({
  id: z.number(),
  name: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

// Document schema
export const DocumentSchema = z.object({
  id: z.number(),
  projectId: z.number(),
  type: DocumentType,
  title: z.string().min(1),
  status: DocumentStatus.optional().default('draft'),
  order: z.number().int().min(0),
  markdown: z.string(),
  parentId: z.number().nullable().optional(),
  wordCount: z.number().int().min(0).optional(),
  updatedAt: z.string().datetime()
});

// Link schema
export const LinkSchema = z.object({
  id: z.number(),
  projectId: z.number(),
  sourceDocId: z.number(),
  targetText: z.string(),
  targetDocId: z.number().nullable(),
  targetAnchor: z.string().nullable(),
  raw: z.string()
});

// Entity schema
export const EntitySchema = z.object({
  id: z.number(),
  projectId: z.number(),
  entityType: DocumentType,
  name: z.string(),
  docId: z.number()
});

// Settings schema
export const SettingSchema = z.object({
  projectId: z.number(),
  key: z.string(),
  value: z.unknown()
});

// YAML Frontmatter schema
export const FrontmatterSchema = z.object({
  id: z.string().uuid().optional(),
  type: DocumentType,
  title: z.string(),
  status: DocumentStatus.optional(),
  order: z.number().optional(),
  updated_at: z.string().optional()
});

// Prompt template types
export const PromptTemplate = z.enum(['draft_scene', 'rewrite_constraint', 'continuity_check']);

// App settings
export const AppSettingsSchema = z.object({
  theme: z.enum(['light', 'dark']).default('dark'),
  lastProjectId: z.number().nullable().optional(),
  sidebarWidth: z.number().optional(),
  rightPanelWidth: z.number().optional()
});

// Validation helpers
export function validateDocument(data) {
  return DocumentSchema.safeParse(data);
}

export function validateProject(data) {
  return ProjectSchema.safeParse(data);
}

export function validateFrontmatter(data) {
  return FrontmatterSchema.safeParse(data);
}
