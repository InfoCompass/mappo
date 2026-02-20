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

		if("items" in data)	return data.items

		throw new Error("No items in response. Maybe you used api. subdomain instead of public. subdomain?")	
	}			

}




export class InfoCompassTaxonomyTranslationsAdapter implements Adapter {

	protected	baseUrl		:	string

	public 		meta 		:	AdapterMeta	
	public 		schedule	:	Observable<void>

	constructor(config : { meta: AdapterMeta, baseUrl: string, schedule: Observable<void>} ){
		this.meta 		= config.meta
		this.baseUrl 	= config.baseUrl
		this.schedule 	= config.schedule
	}


	getTranslation(translations : unknown, path : string[]) : string {
		if(path.length == 0) return String(translations)

		const [current, ...rest] = path

		if(!translations)					return 'MISSING_TRANSLATION'	
		if(typeof translations != 'object') return 'MISSING_TRANSLATION'	
		if(!(current in translations))		return 'MISSING_TRANSLATION'	

		return this.getTranslation(translations[current], rest)

	} 

	async collectAndAdapt() : Promise<Item[]> {

		const taxonomyUrl			= `https://${this.baseUrl}/taxonomy.json`
		const translationsUrl		= `https://api.${this.baseUrl}/translations.json`

		const taxonomyResult 		= await fetch(taxonomyUrl)
		const taxonomy				= await taxonomyResult.json()

		if(!taxonomy || typeof taxonomy != 'object') throw `Unable to fetch taxonomy at ${taxonomyUrl}`

		const translationsResult	= await fetch(translationsUrl)
		const translations			= await translationsResult.json()

		const languages				= Object.keys(translations)

		if(!translations || typeof translations != 'object') throw `Unable to fetch translations at ${translationsUrl}`

		const items					: {}[]
									= []

		// TYPES

		if(Array.isArray(taxonomy.types)){

			taxonomy.types.forEach( (type:unknown) => {

				if(
						!type
					||	typeof type != 'object'
					||	!("name" in type)

				) return

				const name = String(type.name)

				items.push({
					id:				`types-${type.name}`,
					from:			['types'],
					name,
					translations: 	Object.fromEntries(languages.map( 
										lang => [lang, this.getTranslation(translations, [lang, 'TYPES', name.toUpperCase() ])]
									)) 
				})
			})
		}

		// CATEGORIES

		if(Array.isArray(taxonomy.categories)){

			taxonomy.categories.forEach( (category: unknown)  => {
				
				if(
						!category
					||	typeof category != 'object'
					||	!("name" in category)
					
				) return

				const name = String(category.name)				

				items.push({
					id:				`categories-${category.name}`,
					from:			['categories'],
					name,
					translations: 	Object.fromEntries(languages.map( 
										lang => [lang, this.getTranslation(translations, [lang, 'CATEGORIES', name.toUpperCase() ])]
									))  
				})

				if(! ("tags" in category)) return

				if(Array.isArray(category.tags)){
					category.tags.forEach(tag => {
						items.push({
							id: 			`categories-${category.name}-tags-${tag}`,
							from:			['categories', category.name, 'tags'],
							name:			tag,
							translations:	Object.fromEntries(languages.map( 
												lang => [lang, this.getTranslation(translations, [lang, 'CATEGORIES', tag.toUpperCase() ])]
											))  
						})
					})
				}

			})
		}

		// UNSORTED

		if("tags" in taxonomy){

			Object.entries(taxonomy.tags).forEach( ([tagGroup, tags]) => {

				
				if(!Array.isArray(tags) ) return

				tags.forEach(tag => {
					items.push({
						id: 			`tags-${tagGroup}-${tag}`,
						from:			['tags', tagGroup],
						name:			tag,
						translations:	Object.fromEntries(languages.map( 
											lang => [lang, this.getTranslation(translations, [lang, 'UNSORTED_TAGS', tag.toUpperCase() ])]
										)) 
					})
				})
			})
		}


		// OPTIONS

		const optionsUrl 	= `https://api.${this.baseUrl}/options`
		const optionsResult = await fetch(optionsUrl)
		const options		= await optionsResult.json()


		if(options && Array.isArray(options)){

			options.forEach( (option:unknown) => {

				if(!option)						return
				if(typeof option != 'object')	return
				if(!("tag" 		in option))			return
				if(!("key" 		in option))			return
				if(!("label" 	in option))			return	

				const tag	=	String(option.tag)
				const label =	String(option.label)
				const key	=	String(option.key)


				items.push({
						id: 			`tags-options_${key}-${tag}`,
						from:			['tags', `options_${key}`],
						name:			tag,
						translations:	Object.fromEntries(languages.map( 
											lang => [lang, label]
										)) 
					})
			})
		}


		return items

	}	
}