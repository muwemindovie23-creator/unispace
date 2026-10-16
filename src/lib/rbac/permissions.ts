/**
 * The complete catalogue of permission keys.
 *
 * Permission keys are declared here once. Which keys a role grants is stored in
 * the database (AdminRole.permissions), so a new role can be introduced from the
 * dashboard without touching code. Server code must always check a key from this
 * catalogue — never a role name — so that adding a role never means hunting down
 * scattered `role === 'SUPER_ADMIN'` checks.
 */

export const PERMISSIONS = {
  // Platform administration
  PLATFORM_SETTINGS_MANAGE: 'platform.settings.manage',
  PLATFORM_AUDIT_READ: 'platform.audit.read',

  // Universities and campuses
  UNIVERSITY_CREATE: 'university.create',
  UNIVERSITY_UPDATE: 'university.update',
  UNIVERSITY_DELETE: 'university.delete',
  UNIVERSITY_PUBLISH: 'university.publish',
  UNIVERSITY_THEME_EDIT: 'university.theme.edit',
  UNIVERSITY_THEME_PUBLISH: 'university.theme.publish',
  UNIVERSITY_LINKS_MANAGE: 'university.links.manage',
  UNIVERSITY_HOMEPAGE_MANAGE: 'university.homepage.manage',
  CAMPUS_CREATE: 'campus.create',
  CAMPUS_UPDATE: 'campus.update',
  CAMPUS_DELETE: 'campus.delete',

  // Administrators
  ADMIN_READ: 'admin.read',
  ADMIN_INVITE: 'admin.invite',
  ADMIN_SUSPEND: 'admin.suspend',
  ADMIN_ASSIGN_ROLE: 'admin.assign_role',
  ADMIN_ROLE_MANAGE: 'admin.role.manage',

  // Taxonomy (categories)
  TAXONOMY_MANAGE: 'taxonomy.manage',

  // Content modules
  EVENT_READ: 'event.read',
  EVENT_WRITE: 'event.write',
  EVENT_PUBLISH: 'event.publish',
  SRC_READ: 'src.read',
  SRC_WRITE: 'src.write',
  SRC_PUBLISH: 'src.publish',
  TOUR_READ: 'tour.read',
  TOUR_WRITE: 'tour.write',
  TOUR_PUBLISH: 'tour.publish',
  TIP_READ: 'tip.read',
  TIP_WRITE: 'tip.write',
  TIP_PUBLISH: 'tip.publish',

  // Polls
  POLL_READ: 'poll.read',
  POLL_WRITE: 'poll.write',
  POLL_PUBLISH: 'poll.publish',
  POLL_CLOSE: 'poll.close',

  // Businesses
  BUSINESS_READ: 'business.read',
  BUSINESS_WRITE: 'business.write',
  BUSINESS_PUBLISH: 'business.publish',
  BUSINESS_APPLICATION_READ: 'business.application.read',
  BUSINESS_VERIFY: 'business.verify',

  // Advertising
  ADVERTISING_ENQUIRY_READ: 'advertising.enquiry.read',
  ADVERTISING_ENQUIRY_MANAGE: 'advertising.enquiry.manage',
  ADVERTISING_PLACEMENT_MANAGE: 'advertising.placement.manage',

  // Submissions, moderation, contact
  SUBMISSION_READ: 'submission.read',
  SUBMISSION_REVIEW: 'submission.review',
  MODERATION_READ: 'moderation.read',
  MODERATION_RESOLVE: 'moderation.resolve',
  CONTACT_READ: 'contact.read',
  CONTACT_MANAGE: 'contact.manage',

  // Legal documents
  LEGAL_READ: 'legal.read',
  LEGAL_WRITE: 'legal.write',
  LEGAL_PUBLISH: 'legal.publish',
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS)

/**
 * Built-in roles. Seeded into AdminRole and marked isSystem so the dashboard
 * cannot delete them. The permission lists below are the *defaults*; a Super
 * Admin may adjust a non-system role, or create new ones, from the dashboard.
 */
export const SYSTEM_ROLES = {
  SUPER_ADMIN: {
    key: 'super_admin',
    name: 'Super Admin',
    description:
      'Full platform access across every university and campus, including settings, roles and legal documents.',
    allowedScopes: ['PLATFORM'] as const,
    permissions: ALL_PERMISSIONS,
  },
  UNIVERSITY_ADMIN: {
    key: 'university_admin',
    name: 'University Admin',
    description:
      'Manages content across the campuses of one assigned university. Cannot reach another university.',
    allowedScopes: ['UNIVERSITY'] as const,
    permissions: [
      PERMISSIONS.UNIVERSITY_UPDATE,
      PERMISSIONS.UNIVERSITY_LINKS_MANAGE,
      PERMISSIONS.UNIVERSITY_HOMEPAGE_MANAGE,
      PERMISSIONS.CAMPUS_CREATE,
      PERMISSIONS.CAMPUS_UPDATE,
      PERMISSIONS.ADMIN_READ,
      PERMISSIONS.TAXONOMY_MANAGE,
      PERMISSIONS.EVENT_READ,
      PERMISSIONS.EVENT_WRITE,
      PERMISSIONS.EVENT_PUBLISH,
      PERMISSIONS.SRC_READ,
      PERMISSIONS.SRC_WRITE,
      PERMISSIONS.SRC_PUBLISH,
      PERMISSIONS.TOUR_READ,
      PERMISSIONS.TOUR_WRITE,
      PERMISSIONS.TOUR_PUBLISH,
      PERMISSIONS.TIP_READ,
      PERMISSIONS.TIP_WRITE,
      PERMISSIONS.TIP_PUBLISH,
      PERMISSIONS.POLL_READ,
      PERMISSIONS.POLL_WRITE,
      PERMISSIONS.POLL_PUBLISH,
      PERMISSIONS.POLL_CLOSE,
      PERMISSIONS.BUSINESS_READ,
      PERMISSIONS.BUSINESS_WRITE,
      PERMISSIONS.BUSINESS_PUBLISH,
      PERMISSIONS.BUSINESS_APPLICATION_READ,
      PERMISSIONS.BUSINESS_VERIFY,
      PERMISSIONS.SUBMISSION_READ,
      PERMISSIONS.SUBMISSION_REVIEW,
      PERMISSIONS.MODERATION_READ,
      PERMISSIONS.MODERATION_RESOLVE,
      PERMISSIONS.CONTACT_READ,
    ],
  },
  CAMPUS_ADMIN: {
    key: 'campus_admin',
    name: 'Campus Admin',
    description:
      'Manages campus life content for the campuses explicitly assigned to them.',
    allowedScopes: ['CAMPUS'] as const,
    permissions: [
      PERMISSIONS.EVENT_READ,
      PERMISSIONS.EVENT_WRITE,
      PERMISSIONS.EVENT_PUBLISH,
      PERMISSIONS.SRC_READ,
      PERMISSIONS.SRC_WRITE,
      PERMISSIONS.TOUR_READ,
      PERMISSIONS.TOUR_WRITE,
      PERMISSIONS.TOUR_PUBLISH,
      PERMISSIONS.TIP_READ,
      PERMISSIONS.TIP_WRITE,
      PERMISSIONS.TIP_PUBLISH,
      PERMISSIONS.POLL_READ,
      PERMISSIONS.POLL_WRITE,
      PERMISSIONS.POLL_PUBLISH,
      PERMISSIONS.POLL_CLOSE,
      PERMISSIONS.BUSINESS_READ,
      PERMISSIONS.BUSINESS_WRITE,
      PERMISSIONS.BUSINESS_APPLICATION_READ,
      PERMISSIONS.SUBMISSION_READ,
      PERMISSIONS.SUBMISSION_REVIEW,
      PERMISSIONS.MODERATION_READ,
    ],
  },
  CONTENT_EDITOR: {
    key: 'content_editor',
    name: 'Content Editor',
    description:
      'Drafts and edits assigned content but cannot publish it or change settings.',
    allowedScopes: ['UNIVERSITY', 'CAMPUS'] as const,
    permissions: [
      PERMISSIONS.EVENT_READ,
      PERMISSIONS.EVENT_WRITE,
      PERMISSIONS.SRC_READ,
      PERMISSIONS.SRC_WRITE,
      PERMISSIONS.TOUR_READ,
      PERMISSIONS.TOUR_WRITE,
      PERMISSIONS.TIP_READ,
      PERMISSIONS.TIP_WRITE,
      PERMISSIONS.POLL_READ,
      PERMISSIONS.BUSINESS_READ,
      PERMISSIONS.SUBMISSION_READ,
    ],
  },
  BUSINESS_REVIEWER: {
    key: 'business_reviewer',
    name: 'Business Reviewer',
    description:
      'Processes campus business verification applications within an assigned scope.',
    allowedScopes: ['UNIVERSITY', 'CAMPUS'] as const,
    permissions: [
      PERMISSIONS.BUSINESS_READ,
      PERMISSIONS.BUSINESS_WRITE,
      PERMISSIONS.BUSINESS_PUBLISH,
      PERMISSIONS.BUSINESS_APPLICATION_READ,
      PERMISSIONS.BUSINESS_VERIFY,
      PERMISSIONS.MODERATION_READ,
    ],
  },
} as const

export type SystemRoleKey = keyof typeof SYSTEM_ROLES

/** Human-readable labels for the dashboard, grouped by module. */
export const PERMISSION_GROUPS: { label: string; permissions: Permission[] }[] = [
  {
    label: 'Platform',
    permissions: [PERMISSIONS.PLATFORM_SETTINGS_MANAGE, PERMISSIONS.PLATFORM_AUDIT_READ],
  },
  {
    label: 'Universities & campuses',
    permissions: [
      PERMISSIONS.UNIVERSITY_CREATE,
      PERMISSIONS.UNIVERSITY_UPDATE,
      PERMISSIONS.UNIVERSITY_DELETE,
      PERMISSIONS.UNIVERSITY_PUBLISH,
      PERMISSIONS.UNIVERSITY_THEME_EDIT,
      PERMISSIONS.UNIVERSITY_THEME_PUBLISH,
      PERMISSIONS.UNIVERSITY_LINKS_MANAGE,
      PERMISSIONS.UNIVERSITY_HOMEPAGE_MANAGE,
      PERMISSIONS.CAMPUS_CREATE,
      PERMISSIONS.CAMPUS_UPDATE,
      PERMISSIONS.CAMPUS_DELETE,
    ],
  },
  {
    label: 'Administrators',
    permissions: [
      PERMISSIONS.ADMIN_READ,
      PERMISSIONS.ADMIN_INVITE,
      PERMISSIONS.ADMIN_SUSPEND,
      PERMISSIONS.ADMIN_ASSIGN_ROLE,
      PERMISSIONS.ADMIN_ROLE_MANAGE,
    ],
  },
  {
    label: 'Campus life content',
    permissions: [
      PERMISSIONS.TAXONOMY_MANAGE,
      PERMISSIONS.EVENT_READ,
      PERMISSIONS.EVENT_WRITE,
      PERMISSIONS.EVENT_PUBLISH,
      PERMISSIONS.SRC_READ,
      PERMISSIONS.SRC_WRITE,
      PERMISSIONS.SRC_PUBLISH,
      PERMISSIONS.TOUR_READ,
      PERMISSIONS.TOUR_WRITE,
      PERMISSIONS.TOUR_PUBLISH,
      PERMISSIONS.TIP_READ,
      PERMISSIONS.TIP_WRITE,
      PERMISSIONS.TIP_PUBLISH,
    ],
  },
  {
    label: 'Polls',
    permissions: [
      PERMISSIONS.POLL_READ,
      PERMISSIONS.POLL_WRITE,
      PERMISSIONS.POLL_PUBLISH,
      PERMISSIONS.POLL_CLOSE,
    ],
  },
  {
    label: 'Businesses',
    permissions: [
      PERMISSIONS.BUSINESS_READ,
      PERMISSIONS.BUSINESS_WRITE,
      PERMISSIONS.BUSINESS_PUBLISH,
      PERMISSIONS.BUSINESS_APPLICATION_READ,
      PERMISSIONS.BUSINESS_VERIFY,
    ],
  },
  {
    label: 'Advertising',
    permissions: [
      PERMISSIONS.ADVERTISING_ENQUIRY_READ,
      PERMISSIONS.ADVERTISING_ENQUIRY_MANAGE,
      PERMISSIONS.ADVERTISING_PLACEMENT_MANAGE,
    ],
  },
  {
    label: 'Submissions & moderation',
    permissions: [
      PERMISSIONS.SUBMISSION_READ,
      PERMISSIONS.SUBMISSION_REVIEW,
      PERMISSIONS.MODERATION_READ,
      PERMISSIONS.MODERATION_RESOLVE,
      PERMISSIONS.CONTACT_READ,
      PERMISSIONS.CONTACT_MANAGE,
    ],
  },
  {
    label: 'Legal',
    permissions: [PERMISSIONS.LEGAL_READ, PERMISSIONS.LEGAL_WRITE, PERMISSIONS.LEGAL_PUBLISH],
  },
]
