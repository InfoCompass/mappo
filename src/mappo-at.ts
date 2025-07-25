import { scheduleFromCron 	} from "@mappo-aggregato/mappo-aggregato/backend"
import { InfoCompassAdapter } from "./ic-adapter.ts"
import { icRunMappo 		} from './main.ts'


const paAdapter = 	new InfoCompassAdapter({
						meta:	{
							name: 		"at",
							sourceUrl:	"https://beratungsnetz-migration.de",
							sourceName:	"Beratungsnetz Migration"
						},
						url: 		"https://api.socialmap-berlin.de/items",
						schedule: 	scheduleFromCron("at-updates", "30 */1 * * *")
					})	

icRunMappo({
	instanceName: 	"at",
	storageName:	"storage/at-item-storage",
	adapters:		[ paAdapter ],
	port:			9902
})