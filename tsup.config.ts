import { defineConfig } from "tsup";

const shebang = "#!/usr/bin/env node";

const esmDirnameBanner = [
	"import { fileURLToPath as __sw_fileURLToPath } from \"node:url\";",
	"import { dirname as __sw_dirname } from \"node:path\";",
	"const __filename = __sw_fileURLToPath( import.meta.url );",
	"var __dirname = __sw_dirname( __filename );",
].join( "\n" );

export default defineConfig( {
	entry: [
		"src/index.ts",
	],
	format: [
		"esm",
		"cjs",
	],
	dts: true,
	clean: true,
	sourcemap: true,
	banner( { format } ) {

		if ( format === "esm" ) {

			return {
				js: `${ shebang }\n${ esmDirnameBanner }`,
			};

		}

		return {
			js: shebang,
		};

	},
} );
