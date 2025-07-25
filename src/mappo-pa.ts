import { scheduleFromCron 	} from "@mappo-aggregato/mappo-aggregato/backend"
import { InfoCompassAdapter } from "./ic-adapter.ts"
import { icRunMappo 		} from './main.ts'


const paAdapter = 	new InfoCompassAdapter({
						meta:	{
							name: 		"pa",
							sourceUrl:	"https://socialmap-berlin.de",
							sourceName:	"socialmap berlin"
						},
						url: 		"https://api.socialmap-berlin.de/items",
						schedule: 	scheduleFromCron("10 */1 * * *")
					})	

icRunMappo({
	instanceName: 	"pa",
	storageName:	"storage/pa-item-storage",
	adapters:		[ paAdapter ],
	port:			9901
})