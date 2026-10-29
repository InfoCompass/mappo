import { scheduleFromCron 	} from "@mappo-aggregato/mappo-aggregato/backend"
import { InfoCompassAdapter } from "./ic-adapter.ts"
import { icRunMappo 		} from './main.ts'
import { generateJsonSchema } from "./json-schema.ts"
import { GeistigFitAdapter } from "./potsdam-remote/geistig-fit-adapter.ts"

const baseUrl			=	"mittendrin.in"
const sourceName		=	"mittendrin.in – Brandenburg"


const potsdamAdapter 	= 	new InfoCompassAdapter({
								meta:	{
									name: 		"potsdam",
									sourceUrl:	`https://${baseUrl}`,
									sourceName
								},
								url: 		"https://public.mittendrin.in/items",
								schedule: 	scheduleFromCron("potsdam-updates", "20 */1 * * *")
							})	

const geistigFotAdapter = 	new GeistigFitAdapter({
								meta:{
									name: 'geistig-fit-2026',
									sourceName: 'Geistig fit... 2026'		
								},
								url:		'https://www.google.com/maps/d/kml?mid=1f5Oh8PXvI3bzhcZ2DfAJGQVaZiVD9AU',
								schedule:	scheduleFromCron("geistig-fit-2026-updates", "0 1 * * 0")
							})

const propertyDescriptionMap = {
	tags: "List of lower case string tags; [a-z0-9_-] will work. A list of already in use tags and their labels can be found here: https://mappo.mittendrin.in/tt/latest",
	titleAddOn: "If the title is no proper noun, but instead supposed to be translated in the UI, you can add a title version for each language here; e.g. if title is 'Görlitzer Park' leave this property empty. If instead it is 'Stadtpark' add { 'en': 'City park'}.",
	location_ref: "This property holds the id of another item. All location data from that other item will be mirror for the current item.",
	recurring_event: `Recurring hours. Stringified array of rules. Each rule is also an array; e.g. '[[weekly","mon","15:45","16:45",null]]' rule[0] is the iteration interval represented by one of these strings: 'fixed', 'daily', 'mon-fri', 'weekly', 'bi-weekly', 'three-weekly', 'four-weekly', 'first_of_month', 'second_of_month', 'third_of_month', 'fourth_of_month', 'last_of_month'; rule[1] is the day of week represented by one of these strings: 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun' - not always neccessaryary; rule[2] is the start time represented by a string in HH:MM format, rule[3] is the end time represented by a string in HH:MM format; rule[4] is one example date formatted as 'YYYY-MM-DD', the example date is not always neccessary. Omitted values should be null.`											
}

icRunMappo({
	instanceName: 	"potsdam",
	storageName:	"storage/potsdam-item-storage",
	adapters:		[ potsdamAdapter, geistigFotAdapter ],
	port:			9903,
	itemJsonSchema:	async () => await generateJsonSchema(baseUrl, sourceName, propertyDescriptionMap)
})