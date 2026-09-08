import { scheduleFromCron 	} from "@mappo-aggregato/mappo-aggregato/backend"
import { InfoCompassAdapter } from "./ic-adapter.ts"
import { icRunMappo 		} from './main.ts'
import { generateJsonSchema } from "./json-schema.ts"

const baseUrl		=	"mittendrin.in"
const sourceName	=	"mittendrin.in – Brandenburg"


const potsdamAdapter = 	new InfoCompassAdapter({
							meta:	{
								name: 		"potsdam",
								sourceUrl:	`https://${baseUrl}`,
								sourceName
							},
							url: 		"https://public.mittendrin.in/items",
							schedule: 	scheduleFromCron("potsdam-updates", "20 */1 * * *")
						})	

icRunMappo({
	instanceName: 	"potsdam",
	storageName:	"storage/potsdam-item-storage",
	adapters:		[ potsdamAdapter ],
	port:			9903,
	itemJsonSchema:	async () => await generateJsonSchema(baseUrl, sourceName)
})