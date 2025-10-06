import { scheduleFromCron 	} from "@mappo-aggregato/mappo-aggregato/backend"
import { InfoCompassAdapter } from "./ic-adapter.ts"
import { generateJsonSchema	} from "./json-schema.ts"
import { icRunMappo 		} from "./main.ts"

const baseUrl		=	"beratungsnetz-migration.de"
const sourceName	=	"Beratungsnetz Migration"

const paAdapter = 	new InfoCompassAdapter({
						meta:	{
							name: 		"at",
							sourceUrl:	`https://${baseUrl}`,
							sourceName
						},
						url: 			`https://public.${baseUrl}/items`,
						schedule: 		scheduleFromCron("at-updates", "30 */1 * * *"),
					})	

icRunMappo({
	instanceName: 	"at",
	storageName:	"storage/at-item-storage",
	adapters:		[ paAdapter ],
	port:			9902,
	itemJsonSchema:	async () => await generateJsonSchema(baseUrl, sourceName)

})