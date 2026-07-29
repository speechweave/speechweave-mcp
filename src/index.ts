import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createSpeechWeaveMcpServer } from "./server.js";
import { VERSION } from "./version.js";

export { createSpeechWeaveMcpServer } from "./server.js";
export { createClientFromEnv, defaultWaitTimeoutMs } from "./client.js";
export { createHandlers } from "./tools/handlers.js";
export { VERSION } from "./version.js";

async function main() : Promise<void> {

	const server = createSpeechWeaveMcpServer();
	const transport = new StdioServerTransport();
	await server.connect( transport );
	console.error( `speechweave-mcp ${ VERSION } ready on stdio` );

}

const isDirectRun =
	process.argv[ 1 ] != null
	&& (
		process.argv[ 1 ].endsWith( "index.js" )
		|| process.argv[ 1 ].endsWith( "index.cjs" )
		|| process.argv[ 1 ].includes( "speechweave-mcp" )
	);

if ( isDirectRun ) {

	main().catch( ( err ) => {

		console.error( err instanceof Error ? err.message : err );
		process.exit( 1 );

	} );

}
