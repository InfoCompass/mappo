import { scheduleFromCron 	} from "@mappo-aggregato/mappo-aggregato/backend"
import { InfoCompassAdapter } from "./ic-adapter.ts"
import { icRunMappo 		} from './main.ts'


const paAdapter = 	new InfoCompassAdapter({
						meta:	{
							name: 		"pa-adapter",
							sourceUrl:	"https://api.socialmap-berlin.de/items",
							sourceName:	"socialmap berlin"
						},
						url: 		"https://api.socialmap-berlin.de/items",
						schedule: 	scheduleFromCron("10 */1 * * *")
					})	

icRunMappo(
	"mappo-pa",
	"pa-item-storage",
	[ paAdapter ],
	9901
)