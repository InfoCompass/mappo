import { scheduleFromCron 	} from "@mappo-aggregato/mappo-aggregato/backend"
import { InfoCompassAdapter } from "./ic-adapter.ts"
import { icRunMappo 		} from './main.ts'


const potsdamAdapter = 	new InfoCompassAdapter({
							meta:	{
								name: 		"potsdam",
								sourceUrl:	"https://mittendrin.in",
								sourceName:	"mittendrin.in – Brandenburg"
							},
							url: 		"https://public.mittendrin.in",
							schedule: 	scheduleFromCron("potsdam-updates", "20 */1 * * *")
						})	

icRunMappo({
	instanceName: 	"potsdam",
	storageName:	"storage/potsdam-item-storage",
	adapters:		[ potsdamAdapter ],
	port:			9901
})