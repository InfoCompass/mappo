import	{ 
			type Adapter, 
			MappoBackend, 
			DenoKvStorage, 
			NaiveMappoDiffer, 
			getOakRouter, 
			LogSubject  
		} 								from "@mappo-aggregato/mappo-aggregato/backend"
import	{ 
			Application, 
			Context, 
			Next 
		} 								from "@oak/oak"


export async function icRunMappo(
	instanceName	: string,
	storageName		: string,
	adapters		: Adapter[],
	port			: number,
){


	const mappo 	= 	new MappoBackend({
							storage			: new DenoKvStorage(storageName),
							differ			: new NaiveMappoDiffer(),
							adapters		: adapters,
						})

	const log		=	new LogSubject()

	log.importLogsFrom(mappo.log$, instanceName)
	log.importUncaughtErrors()
	log.importUnhandledRejections()

	log.subscribe( data => {
		data.level === "error"
		?	console.error(data)
		:	console.info(data) 
	})

	await mappo.start()

	const app 		= new Application()
	const router 	= getOakRouter(mappo)

	app.use((ctx : Context,  next: Next) => {
		ctx.response.headers.set('Access-Control-Allow-Origin', '*')
		return next()
	})

	app.use(router.routes())
	app.use(router.allowedMethods())

	app.addEventListener("listen", () => log.info("Listening on 8099"))
	app.listen({ port })

	await mappo.updateAll()
}
