import { decode } from 'decode-formdata';

export type ParsedMailbox = {
	address: string | null;
	name: string | null;
	raw: string;
};

export type FormEmailPayload = {
	from?: string;
	to?: string | string[];
	cc?: string | string[];
	bcc?: string | string[];
	subject?: string;
	text?: string;
	html?: string;
	messageId?: string;
	receivedAt?: string;
	headers?: Record<string, unknown>;
	attachments?: File | File[];
};

const splitAddresses = (value: string) =>
	value
		.split(/[,;]/)
		.map((part) => part.trim())
		.filter(Boolean);

export const parseMailbox = (value?: string | null): ParsedMailbox | null => {
	if (!value)
		return null;

	const trimmed = value.trim();
	if (!trimmed)
		return null;

	const match = trimmed.match(/^(.*)<([^>]+)>$/);
	if (match) {
		const name = match[1].trim().replace(/^"|"$/g, '');
		const address = match[2].trim();
		if (!address)
			return null;

		return {
			address,
			name: name || null,
			raw: trimmed,
		};
	}

	if (trimmed.includes('@')) {
		return {
			address: trimmed,
			name: null,
			raw: trimmed,
		};
	}

	return {
		address: null,
		name: trimmed,
		raw: trimmed,
	};
};

export const normalizeMailboxList = (
	value?: string | string[] | null,
): ParsedMailbox[] => {
	const values = Array.isArray(value)
		? value.flatMap((entry) => splitAddresses(entry))
		: typeof value === 'string'
		? splitAddresses(value)
		: [];

	return values
		.map((entry) => parseMailbox(entry))
		.filter((entry): entry is ParsedMailbox => !!entry);
};

export const normalizeHeaders = (
	value?: Record<string, unknown> | null,
): Record<string, string> | null => {
	if (!value || Array.isArray(value))
		return null;

	const headers: Record<string, string> = {};
	for (const [key, entry] of Object.entries(value)) {
		if (typeof entry === 'string')
			headers[key] = entry;
	}

	return Object.keys(headers).length ? headers : null;
};

export const normalizeFiles = (
	value?: File | File[] | null,
	fallback?: FormDataEntryValue[],
): File[] => {
	const files: File[] = [];
	const addFile = (entry: unknown) => {
		if (entry instanceof File)
			files.push(entry);
	};

	if (Array.isArray(value))
		value.forEach(addFile);
	else
		addFile(value);

	if (!files.length && fallback)
		fallback.forEach(addFile);

	return files;
};

export const decodeFormData = (formData: FormData) =>
	decode(formData, {
		arrays: ['to', 'cc', 'bcc', 'attachments'],
		files: ['attachments'],
	}) as FormEmailPayload;
