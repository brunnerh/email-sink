import type { Snippet } from 'svelte';

export type StringOrSnippet<T = unknown> =
	| string
	| { template: Snippet<[]> }
	| { template: Snippet<[T]>; args: T };
