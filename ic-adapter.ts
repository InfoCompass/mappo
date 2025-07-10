import { type Adapter, AdapterMeta, Item } from "@mappo-aggregato/mappo-aggregato"
import { Observable } from "rxjs"



export class InfoCompassAdapter implements Adapter {

	protected	url			:	string

	public 		meta 		:	AdapterMeta	
	public 		schedule	:	Observable<void>

	constructor(config : { meta: AdapterMeta, url: string, schedule: Observable<void>} ){
		this.meta 		= config.meta
		this.url 		= config.url
		this.schedule 	= config.schedule
	}	

	async collectAndAdapt() : Promise<Item[]> {
		const result 	= await fetch(this.url)
		const data		= await result.json()

		return data
	}			

}
