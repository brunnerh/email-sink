# Base Instructions

## Security

Do **not** read or modify the `.env` file at the root of the project, if it
exists.

## Process

- Use `deno task ...` to run scripts.
- For type checking use the script `check`.
- For testing use the script `test`.
- Always run checks and tests after making any significant changes.
- Format the project using the script `format`.\
  Important: If a file is listed in the output, you should re-read the file
  before applying follow up patches to it, otherwise the patch might fail.

## Styling

- Do not use hard coded colors directly. Reference CSS variables that are
  theme-dependent.
- Supported themes are `white` and `g90` (a dark theme) from the Carbon Design
  System.
- Existing colors of the design system can be found in:
  `node_modules/carbon-components-svelte/css/all.css`
- Explanations of the colors can be found here:\
  https://carbondesignsystem.com/elements/color/tokens/\
  The names use `$<name>` on the website, but `--cds-<name>` in CSS.\
  There might also be some mismatch because of versioning.
- If you cannot use an existing color and you only need one locally, use a block
  like the following in the component's `<style>`:
  ```css
  :global(:root) {
  	/* name is global, so it should be unique enough */
  	--my-local-color-a: #123456;
  	--my-local-color-b: #abcdef;

  	&[theme='g90'] {
  		--my-local-color-a: #654321;
  		--my-local-color-b: #fedcba;
  	}
  }
  ```
- Spacings have use a pixel value (or something equivalent) from this list:\
  0, 2, 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96, 160
- Do not mess with the styling or layout of components from
  `carbon-components-svelte` unless really necessary. They already have a
  pre-defined look and set sizes. Sometimes different variants and sizes are
  available via props. Except from layout of the components, style changes
  should be minimal.
- Space inputs `16px` apart from each other, usually vertically.
- If you need vibrant colors, use the ones defined in `src/routes/theme.css`.
- Use Tailwind utilities where appropriate, e.g. for layout and spacings.
- Do not use the `Stack` component, you can use Tailwind flexbox utilities
  instead.
- Do not use the `Form` component, use a regular `<form>` element and if a
  server action is used, apply `use:enhance` from `$app/forms` to it.

## Security

- Every route has to have at least one guard (`src/lib/server/auth/guards.ts`).
- Access to objects is associated with _sinks_. Any objects further down the
  access hierarchy (e.g. emails, attachments) should be protected by checking
  access to the associated sink. For checking access to sinks, use a
  user-specific query like `loadSinkForUser` and `listSinksForUser`.
- Checks in `load` functions higher up in the layout hierarchy, do **not**
  protect lower level `load` functions. `load` functions run in parallel. Access
  checks should be done in the central server hook (`src/hooks.server.ts`) or in
  the individual `load` functions for their respective data.

## Other Notes

- Wherever a path is used for navigation or redirects, use `resolve` from
  `$app/paths` to generate the final path. This ensures that any base path is
  correctly applied. For checks in hooks, compare with the route ID instead.
- On the server, do not unnecessarily pass around data from the request event
  like `locals`. Functions can access the event internally via `getRequestEvent`
  from `$app/server`.
