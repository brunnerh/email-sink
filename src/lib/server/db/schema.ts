import {
	boolean,
	customType,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	serial,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import { Buffer } from 'node:buffer';

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
	dataType() {
		return 'bytea';
	},
});

export const authRuleType = pgEnum('auth_rule_type', [
	'equals',
	'contains',
	'starts_with',
	'ends_with',
]);

export const recipientType = pgEnum('recipient_type', [
	'to',
	'cc',
	'bcc',
]);

export const user = pgTable('user', {
	id: serial('id').primaryKey(),
	email: text('email').notNull().unique(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull()
		.defaultNow(),
	lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
});

export const session = pgTable('session', {
	id: text('id').primaryKey(),
	userId: integer('user_id').references(() => user.id, {
		onDelete: 'set null',
	}),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull()
		.defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull()
		.defaultNow(),
	expiresAt: timestamp('expires_at', { withTimezone: true }),
});

export const loginKey = pgTable('login_key', {
	id: serial('id').primaryKey(),
	keyHash: text('key_hash').notNull().unique(),
	sessionId: text('session_id').notNull().references(() => session.id, {
		onDelete: 'cascade',
	}),
	email: text('email').notNull(),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
	usedAt: timestamp('used_at', { withTimezone: true }),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull()
		.defaultNow(),
});

export const sink = pgTable('sink', {
	id: serial('id').primaryKey(),
	name: text('name').notNull(),
	slug: text('slug').notNull().unique(),
	isAuthEnabled: boolean('is_auth_enabled').notNull().default(false),
	createdByUserId: integer('created_by_user_id').references(() => user.id, {
		onDelete: 'set null',
	}),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull()
		.defaultNow(),
});

export const sinkApiKey = pgTable('sink_api_key', {
	id: serial('id').primaryKey(),
	sinkId: integer('sink_id').notNull().references(() => sink.id, {
		onDelete: 'cascade',
	}),
	name: text('name').notNull(),
	keyHash: text('key_hash').notNull().unique(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull()
		.defaultNow(),
	lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
});

export const sinkAuthRule = pgTable('sink_auth_rule', {
	id: serial('id').primaryKey(),
	sinkId: integer('sink_id').notNull().references(() => sink.id, {
		onDelete: 'cascade',
	}),
	type: authRuleType('type').notNull(),
	value: text('value').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull()
		.defaultNow(),
});

export const email = pgTable('email', {
	id: serial('id').primaryKey(),
	sinkId: integer('sink_id').notNull().references(() => sink.id, {
		onDelete: 'cascade',
	}),
	subject: text('subject'),
	messageId: text('message_id'),
	fromAddress: text('from_address'),
	fromName: text('from_name'),
	headers: jsonb('headers'),
	textContent: text('text_content'),
	htmlContent: text('html_content'),
	rawContent: text('raw_content'),
	receivedAt: timestamp('received_at', { withTimezone: true }).notNull()
		.defaultNow(),
});

export const emailRecipient = pgTable('email_recipient', {
	id: serial('id').primaryKey(),
	emailId: integer('email_id').notNull().references(() => email.id, {
		onDelete: 'cascade',
	}),
	type: recipientType('type').notNull(),
	address: text('address'),
	name: text('name'),
	raw: text('raw'),
});

export const attachmentBlob = pgTable('attachment_blob', {
	id: serial('id').primaryKey(),
	sha256: text('sha256').notNull().unique(),
	size: integer('size').notNull(),
	content: bytea('content').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull()
		.defaultNow(),
});

export const emailAttachment = pgTable('email_attachment', {
	id: serial('id').primaryKey(),
	emailId: integer('email_id').notNull().references(() => email.id, {
		onDelete: 'cascade',
	}),
	blobId: integer('blob_id').notNull().references(() => attachmentBlob.id, {
		onDelete: 'restrict',
	}),
	filename: text('filename'),
	contentType: text('content_type'),
	contentId: text('content_id'),
	disposition: text('disposition'),
	size: integer('size').notNull(),
});
