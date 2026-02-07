import { describe, expect, it } from 'vitest';
import { stripAttachmentBodies } from './raw-ingest';

describe('stripAttachmentBodies', () => {
	it('leaves non-multipart messages intact', () => {
		const input = [
			'From: sender@example.com',
			'To: receiver@example.com',
			'Subject: Hello',
			'',
			'Plain body',
		].join('\n');

		expect(stripAttachmentBodies(input)).toBe(input);
	});

	it('strips attachment bodies while preserving boundaries', () => {
		const input = [
			'From: noreply@muh-company.com',
			'To: john@example.com, jane@example.com',
			'Subject: Hello',
			'X-Custom: demo',
			'MIME-Version: 1.0',
			'Content-Type: multipart/mixed; boundary="boundary42"',
			'',
			'--boundary42',
			'Content-Type: text/plain; charset="utf-8"',
			'',
			'Hello from raw mail.',
			'',
			'--boundary42',
			'Content-Type: text/plain; name="hello.txt"',
			'Content-Disposition: attachment; filename="hello.txt"',
			'',
			'So this is a story all about how',
			'--boundary42',
			'Content-Type: text/markdown; name="AGENTS.md"',
			'Content-Disposition: attachment; filename="AGENTS.md"',
			'',
			'Make no mistakes. Make it secure.',
			'',
			'--boundary42--',
		].join('\n');

		const output = stripAttachmentBodies(input);

		expect(output).toContain('Content-Type: text/plain; charset="utf-8"');
		expect(output).toContain('Hello from raw mail.');
		expect(output).toContain('[stripped]');
		expect(output).toContain('--boundary42--');
		expect(output).toContain(
			'Content-Disposition: attachment; filename="hello.txt"',
		);
		expect(output).toContain(
			'Content-Disposition: attachment; filename="AGENTS.md"',
		);
		expect(output).not.toContain('So this is a story all about how');
		expect(output).not.toContain('Make no mistakes. Make it secure.');
	});

	it('preserves multipart bodies with no attachment headers', () => {
		const input = [
			'From: sender@example.com',
			'To: receiver@example.com',
			'Subject: Multipart',
			'MIME-Version: 1.0',
			'Content-Type: multipart/alternative; boundary="alt"',
			'',
			'--alt',
			'Content-Type: text/plain; charset="utf-8"',
			'',
			'Plain body',
			'--alt',
			'Content-Type: text/html; charset="utf-8"',
			'',
			'<p>HTML body</p>',
			'--alt--',
		].join('\n');

		expect(stripAttachmentBodies(input)).toBe(input);
	});

	it('preserves CRLF newlines and closing boundary markers', () => {
		const input = [
			'From: sender@example.com',
			'To: receiver@example.com',
			'Subject: CRLF',
			'MIME-Version: 1.0',
			'Content-Type: multipart/mixed; boundary=xyz',
			'',
			'--xyz',
			'Content-Type: text/plain; name="note.txt"',
			'Content-Disposition: attachment; filename="note.txt"',
			'',
			'Note body',
			'--xyz--',
		].join('\r\n');

		const output = stripAttachmentBodies(input);
		expect(output).toContain('\r\n--xyz\r\n');
		expect(output).toContain('[stripped]\r\n--xyz--');
		expect(output).not.toContain('Note body');
	});

	it('ignores multipart messages without a boundary', () => {
		const input = [
			'From: sender@example.com',
			'To: receiver@example.com',
			'Subject: No boundary',
			'MIME-Version: 1.0',
			'Content-Type: multipart/mixed',
			'',
			'Body content',
		].join('\n');

		expect(stripAttachmentBodies(input)).toBe(input);
	});
});
