import { MappoBackend, type Adapter, AdapterMeta, scheduleFromCron, DenoKvStorage, NaiveMappoDiffer, getOakRouter, Item, LogSubject  } from "@mappo-aggregato/mappo-aggregato"
import { Observable } from "rxjs"
import { Application, Context, Next } from "@oak/oak"

class InfoCompassAdapter implements Adapter {

	protected url	:	string

	public meta 	:	AdapterMeta	
	public schedule	:	Observable<void>

	constructor(config : { meta: AdapterMeta, url: string, schedule: Observable<void>} ){
		this.meta 		= config.meta
		this.url 		= config.url
		this.schedule 	= config.schedule
	}	

	async collectAndAdapt() : Promise<Item[]> {
		const result 	= await fetch(this.url)
		const data		= await result.json()

		return data.items	 
	}			
}

const paAdapter = 	new InfoCompassAdapter({
						meta:	{
							name: 		"pa-adapter",
							sourceUrl:	"https://public.socialmap-berlin.de",
							sourceName:	"socialmap berlin"
						},
						url: "https://public.socialmap-berlin.de/items",
						schedule: scheduleFromCron("*/5 * * * *")
					})		

const mappo = 	new MappoBackend({
					storage			: new DenoKvStorage("pa-item-storage"),
					differ			: new NaiveMappoDiffer(),
					adapters		: [ paAdapter ],
				})

const log	=	new LogSubject()

log.importLogsFrom(mappo.log$)
log.importUncaughtErrors()
log.importUnhandledRejections()

log.subscribe( x => console.log(x) )

await mappo.start()


const app = new Application()

const router = getOakRouter(mappo)

app.use((ctx : Context,  next: Next) => {
  ctx.response.headers.set('Access-Control-Allow-Origin', '*')
  return next()
})

app.use(router.routes())
app.use(router.allowedMethods())

app.listen({ port: 8099 })

await mappo.updateAll()
