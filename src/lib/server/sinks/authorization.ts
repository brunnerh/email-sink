import type { sinkAuthRule } from '$lib/server/db/schema';

type SinkAuthRule = typeof sinkAuthRule.$inferSelect;

const normalize = (value: string) => value.trim().toLowerCase();

export const matchesAuthRule = (email: string, rule: SinkAuthRule) => {
	const normalizedEmail = normalize(email);
	const normalizedValue = normalize(rule.value);

	switch (rule.type) {
		case 'equals':
			return normalizedEmail === normalizedValue;
		case 'contains':
			return normalizedEmail.includes(normalizedValue);
		case 'starts_with':
			return normalizedEmail.startsWith(normalizedValue);
		case 'ends_with':
			return normalizedEmail.endsWith(normalizedValue);
		default:
			return false;
	}
};

export const isEmailAuthorizedForSink = (
	email: string,
	rules: SinkAuthRule[],
) => rules.some((rule) => matchesAuthRule(email, rule));
