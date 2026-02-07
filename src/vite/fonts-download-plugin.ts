import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Plugin } from 'vite';
import process from 'node:process';
import { Buffer } from 'node:buffer';

/** Downloads referenced fonts. */
export function fontsDownloadPlugin(
	pluginOptions: FontDownloadPluginOptions,
): Plugin {
	let command: 'build' | 'serve';

	return {
		name: 'fonts-download-plugin',
		config(_config, env) {
			command = env.command;
		},
		async transform(code, id) {
			if (process.env.CI)
				return;

			if (path.extname(id) != '.css')
				return;

			if (fs.existsSync(pluginOptions.cacheDirectoryPath) == false) {
				fs.mkdirSync(pluginOptions.cacheDirectoryPath, {
					recursive: true,
				});
			}

			const search = /url\("(https?:\/\/[^")]*\.woff2?)"\)/g;
			for (const [_match, url] of code.matchAll(search)) {
				const name = path.basename(url);
				const cachePath = path.join(
					pluginOptions.cacheDirectoryPath,
					name,
				);
				if (fs.existsSync(cachePath) == false) {
					this.info(`Caching font: ${url}`);
					const buffer = await fetch(url).then((r) =>
						r.arrayBuffer()
					);
					fs.writeFileSync(cachePath, Buffer.from(buffer), {
						flag: 'wx',
					});
				}
			}

			const replacedSource = code.replaceAll(search, (_match, url) => {
				const name = path.basename(url);
				const data = fs.readFileSync(
					path.join(pluginOptions.cacheDirectoryPath, name),
				);

				if (command == 'build') {
					const fileName = '_app/immutable/fonts/' + name;
					this.emitFile({
						type: 'asset',
						fileName: fileName,
						source: data,
					});

					return `url("/${fileName}")`;
				}
				else {
					return `url("data:font/woff2;base64,${
						data.toString('base64')
					}")`;
				}
			});

			return replacedSource;
		},
	};
}

export interface FontDownloadPluginOptions {
	/** Path to directory used to store fonts locally. */
	cacheDirectoryPath: string;
}
