import	{ 
			type Adapter, 
			MappoBackend, 
			DenoKvStorage, 
			NaiveMappoDiffer, 
			getOakRouter, 
			LogSubject,
			flatLog ,
			MappoBackendConfig 
		} 								from "@mappo-aggregato/mappo-aggregato/backend"
import	{ 
			Application, 
			Context, 
			Next 
		} 								from "@oak/oak"


export interface RunConfig {	
	instanceName	: string,
	storageName		: string,
	adapters		: Adapter[],
	port			: number,
	itemJsonSchema?	: Record<string, unknown> | (() => Promise<Record<string, unknown>>)
}

export async function icRunMappo({
	instanceName,
	storageName,
	adapters,
	port,
	itemJsonSchema
} : RunConfig){


	const mappo 	= 	new MappoBackend({
							storage			: new DenoKvStorage(storageName),
							differ			: new NaiveMappoDiffer(),
							adapters		: adapters,
							itemJsonSchema	: (itemJsonSchema as MappoBackendConfig["itemJsonSchema"])
						})

	const log		=	new LogSubject()

	log.importLogsFrom(mappo.log$, `MappoBackend(${instanceName})`, "prefix")
	log.importUncaughtErrors()
	log.importUnhandledRejections()

	log.subscribe(flatLog)

	await mappo.start()

	const app 		= new Application()
	const router 	= getOakRouter(mappo)

	app.use((ctx : Context,  next: Next) => {
		ctx.response.headers.set('Access-Control-Allow-Origin', '*')
		return next()
	})

	app.use(router.routes())
	app.use(router.allowedMethods())

	app.addEventListener("listen", () => log.info(`Listening on port ${port}`))
	app.addEventListener("close", event => log.error(new Error('Closed unexpectedly.'), { event }))
	app.addEventListener("error", event => log.error(new Error('Uncaught error in oak application'), {cause: event}) )
	app.listen({ port })

	await mappo.updateAll()

}
