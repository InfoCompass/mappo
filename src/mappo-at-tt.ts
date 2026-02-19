import { scheduleFromCron 						} from "@mappo-aggregato/mappo-aggregato/backend"
import { InfoCompassTaxonomyTranslationsAdapter	} from "./ic-adapter.ts"
import { icRunMappo 							} from './main.ts'


const baseUrl		=	"beratungsnetz-migration.de"
const sourceName	=	"Beratungsnetz Migration"


const atTTAdapter 	= 	new InfoCompassTaxonomyTranslationsAdapter({
							meta:	{
								name: 		"at-tt",
								sourceUrl:	`https://${baseUrl}`,
								sourceName
							},
							baseUrl,
							schedule: 	scheduleFromCron("at-tt-updates", "20 */1 * * *")
						})	

icRunMappo({
	instanceName: 	"at-tt",
	storageName:	"storage/at-tt-item-storage",
	adapters:		[ atTTAdapter ],
	port:			9912
})
