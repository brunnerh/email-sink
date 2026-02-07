import { describe, expect, it } from 'vitest';
import {
	decodeFormData,
	normalizeFiles,
	normalizeHeaders,
	normalizeMailboxList,
	parseMailbox,
} from './form-ingest';

describe('form ingest helpers', () => {
	it('parses mailbox with name and address', () => {
		const mailbox = parseMailbox('Jane Doe <jane@example.com>');
		expect(mailbox).toEqual({
			address: 'jane@example.com',
			name: 'Jane Doe',
			raw: 'Jane Doe <jane@example.com>',
		});
	});

	it('splits comma-separated recipients', () => {
		const recipients = normalizeMailboxList('a@example.com, b@example.com');
		expect(recipients.map((entry) => entry.address)).toEqual([
			'a@example.com',
			'b@example.com',
		]);
	});

	it('decodes headers from dot notation', () => {
		const formData = new FormData();
		formData.set('headers.x-custom', 'alpha');
		const payload = decodeFormData(formData);
		const headers = normalizeHeaders(payload.headers ?? null);
		expect(headers).toEqual({ 'x-custom': 'alpha' });
	});

	it('collects files from attachments', () => {
		const file = new File(['hello'], 'note.txt', { type: 'text/plain' });
		const files = normalizeFiles(file);
		expect(files).toHaveLength(1);
		expect(files[0].name).toBe('note.txt');
	});

	it('supports repeated to fields', () => {
		const formData = new FormData();
		formData.append('to', 'a@example.com');
		formData.append('to', 'b@example.com');
		const payload = decodeFormData(formData);
		const recipients = normalizeMailboxList(payload.to);
		expect(recipients.map((entry) => entry.address)).toEqual([
			'a@example.com',
			'b@example.com',
		]);
	});
});
