import { z } from 'zod';

export const ExitCode = {
  SUCCESS: 0,
  BLOCKED_APPROVAL: 1,
  INVALID_INPUT: 2,
  LOCK_OR_CORRUPTION: 3,
  FATAL_ERROR: 4
} as const;

export type ExitCodeValue = (typeof ExitCode)[keyof typeof ExitCode];

export const StepStatusSchema = z.enum([
  'NOT_STARTED',
  'IN_PROGRESS',
  'AWAITING_APPROVAL',
  'LOCKED',
  'COMPLETED'
]);

export type StepStatus = z.infer<typeof StepStatusSchema>;

export const StepSummarySchema = z.object({
  stepNumber: z.number().int().min(0).max(14),
  stepName: z.string().min(1),
  artifactPath: z.string().min(1),
  lockedAt: z.string().datetime({ offset: true }).or(z.string().min(10)),
  summary: z.string().min(1),
  artifactSha256: z.string().length(64)
});

export type StepSummary = z.infer<typeof StepSummarySchema>;

export const UncommittedBufferSchema = z.object({
  lastUserMessage: z.string().optional(),
  pendingDraftSummary: z.string().optional(),
  activeDraft: z.unknown().optional(),
  unresolvedQuestions: z.array(z.unknown()).optional(),
  interruptedAt: z.string().optional()
});

export type UncommittedBuffer = z.infer<typeof UncommittedBufferSchema>;

export const SessionStateSchema = z.object({
  version: z.number().int().positive(),
  projectId: z.string().min(1),
  activeStep: z.number().int().min(0).max(14),
  stepStatus: StepStatusSchema,
  turnCount: z.number().int().nonnegative(),
  lastTurnTimestamp: z.string().datetime({ offset: true }).or(z.string().min(10)),
  lockedSteps: z.array(z.number().int().min(0).max(14)),
  stepSummaries: z.record(z.string(), StepSummarySchema),
  uncommittedBuffer: UncommittedBufferSchema,
  toolVersion: z.string().optional(),
  stayOnOldVersion: z.boolean().optional(),
  tone: z.enum(['builder', 'enterprise']).default('builder').optional()
});

export type SessionState = z.infer<typeof SessionStateSchema>;

export const ArtifactSnapshotSchema = z.object({
  id: z.string().optional(),
  stepNumber: z.number().int().min(0).max(14),
  revision: z.number().int().nonnegative(),
  artifactPath: z.string().min(1),
  content: z.string(),
  sha256: z.string().length(64),
  createdAt: z.string()
});

export type ArtifactSnapshot = z.infer<typeof ArtifactSnapshotSchema>;

export const AuditEventSchema = z.object({
  id: z.string().optional(),
  timestamp: z.string(),
  eventType: z.enum([
    'INIT',
    'TURN_EXECUTED',
    'QUESTIONS_GENERATED',
    'QUESTIONS_ANSWERED',
    'APPROVAL_REQUESTED',
    'APPROVAL_ACCEPTED',
    'APPROVAL_REJECTED',
    'STAGE_LOCKED',
    'STAGE_ADVANCED',
    'STAGE_AMENDED',
    'RESTORE_PERFORMED',
    'MIGRATION_COMPLETED',
    'INTEGRITY_VIOLATION'
  ]),
  stepNumber: z.number().int().min(0).max(14).optional(),
  actor: z.string(),
  details: z.string()
});

export type AuditEvent = z.infer<typeof AuditEventSchema>;

export const AgentTurnResultSchema = z.object({
  success: z.boolean(),
  exitCode: z.number().int().min(0).max(4),
  stage: z.number().int().min(0).max(14),
  message: z.string(),
  isReadyForSignoff: z.boolean(),
  isLocked: z.boolean(),
  activeDraft: z.unknown().optional(),
  unresolvedQuestions: z.array(z.unknown()).optional(),
  artifactSummary: z.string().optional(),
  documentPath: z.string().optional(),
  error: z.string().optional()
});

export type AgentTurnResult<T = unknown> = z.infer<typeof AgentTurnResultSchema> & {
  activeDraft?: T;
};
