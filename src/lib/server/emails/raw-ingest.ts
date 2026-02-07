export function stripAttachmentBodies(raw: string) {
	const separatorMatch = raw.match(/\r?\n\r?\n/);
	if (!separatorMatch || separatorMatch.index == null)
		return raw;

	const separator = separatorMatch[0];
	const headers = raw.slice(0, separatorMatch.index);
	const body = raw.slice(separatorMatch.index + separator.length);
	const unfoldedHeaders = headers.replace(/\r?\n[ \t]+/g, ' ');
	const boundaryMatch = unfoldedHeaders.match(
		/content-type:\s*multipart\/[^;\n]+;[^\n]*boundary="?([^"\n;]+)"?/i,
	);
	const boundary = boundaryMatch?.[1];
	if (!boundary)
		return raw;

	const boundaryMarker = `--${boundary}`;
	const segments = body.split(boundaryMarker);
	if (segments.length === 1)
		return raw;

	const lineBreak = separator.includes('\r\n') ? '\r\n' : '\n';
	const preamble = segments.shift() ?? '';
	let outputBody = preamble;

	for (const segment of segments) {
		if (segment.startsWith('--')) {
			outputBody += boundaryMarker + segment;
			continue;
		}

		outputBody += boundaryMarker + stripPart(segment, lineBreak);
	}

	return `${headers}${separator}${outputBody}`;
}

function stripPart(segment: string, lineBreak: string) {
	const leadingMatch = segment.match(/^(\r?\n)*/);
	const leading = leadingMatch?.[0] ?? '';
	const rest = segment.slice(leading.length);
	const separatorMatch = rest.match(/\r?\n\r?\n/);
	if (!separatorMatch || separatorMatch.index == null)
		return segment;

	const separator = separatorMatch[0];
	const headers = rest.slice(0, separatorMatch.index);
	const body = rest.slice(separatorMatch.index + separator.length);
	const unfoldedHeaders = headers.replace(/\r?\n[ \t]+/g, ' ');
	const hasAttachmentDisposition =
		/content-disposition:\s*attachment/i.test(unfoldedHeaders) ||
		/content-disposition:[^\n]*filename=/i.test(unfoldedHeaders);
	const hasNamedContent = /content-type:[^\n]*name=/i.test(unfoldedHeaders);
	const shouldStrip = hasAttachmentDisposition || hasNamedContent;

	if (!shouldStrip)
		return segment;

	return `${leading}${headers}${separator}[stripped]${lineBreak}`;
}
