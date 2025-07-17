import	{ 
			type Adapter, 
			MappoBackend, 
			DenoKvStorage, 
			NaiveMappoDiffer, 
			getOakRouter, 
			LogSubject,
			flatLog  
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
}

export async function icRunMappo({
	instanceName,
	storageName,
	adapters,
	port,
} : RunConfig){


	const mappo 	= 	new MappoBackend({
							storage			: new DenoKvStorage(storageName),
							differ			: new NaiveMappoDiffer(),
							adapters		: adapters,
						})

	const log		=	new LogSubject()

	log.importLogsFrom(mappo.log$, `MappoBacken(${instanceName})`, "prefix")
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
	app.listen({ port })

	await mappo.updateAll()
}
