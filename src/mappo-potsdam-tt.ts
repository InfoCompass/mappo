import { scheduleFromCron 						} from "@mappo-aggregato/mappo-aggregato/backend"
import { InfoCompassTaxonomyTranslationsAdapter	} from "./ic-adapter.ts"
import { icRunMappo 							} from './main.ts'


const baseUrl		=	"mittendrin.in"
const sourceName	=	"mittendrin.in – Brandenburg: Taxonomy Translations"



const potsdamTTAdapter 	= 	new InfoCompassTaxonomyTranslationsAdapter({
								meta:	{
									name: 		"potsdam-tt",
									sourceUrl:	`https://${baseUrl}`,
									sourceName
								},
								baseUrl,
								schedule: 	scheduleFromCron("potsdam-tt-updates", "35 */1 * * *")
							})	

icRunMappo({
	instanceName: 	"potsdam-tt",
	storageName:	"storage/potsdam-tt-item-storage",
	adapters:		[ potsdamTTAdapter ],
	port:			9913
})
