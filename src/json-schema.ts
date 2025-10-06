export async function generateJsonSchema(baseUrl: string, sourceName: string, descriptionMap : Record<string, string> = {}) : Promise<Record<string, unknown>> {

	const response			=	await fetch(`https://api.${baseUrl}/ic-item-config.js`)
	const itemConfigScript	=	await response.text()
	const script			=	itemConfigScript.replace(/(?<=}\()(.*)(?=\)\)\s*$)/gs, "itemConfig")

	const itemConfig			:	Record<string, unknown>
							=	{}
	eval(script)

	const properties		:	Record<string, unknown>
							=	{}

	if(!("properties" in itemConfig)) 			throw new Error("Unable to get icItemConfig properties.")
	if(!Array.isArray(itemConfig.properties))	throw new Error("icItemConfig properties is not an array.")					

	itemConfig.properties.forEach( property => {

		if(property.internal) return

		const key				= 	property.name
		const title 			= 	property.name
		const description		=	descriptionMap[key]
		const type				=	property.type
		const enum_				=	property.options
		const patternProperties	=	property.translatable
									?	{
											"^[a-z]{2}$": 	{ 
																type: 			"string" ,
																description:	"Content translated into the language determined by the language code used in this property's key. (e.g. 'en' or 'de')"
															}
										}
									:	undefined

									


		properties[key] 	= 	{ 
									title,  
									type,
									... enum_				?	{ enum: enum_}			:	{},
									... description			?	{ description }			:	{},
									... patternProperties	?	{ patternProperties }	:	{},

								}
	})

	const required			=	itemConfig.properties
								.filter( ({mandatory}) => mandatory)
								.map( ({name}) => name )

	const jsonSchema		=	{
									title: 			"Item",
									description:	`An entry of ${sourceName}`,
									type: 			"object",
									properties,
									required
								}
	return jsonSchema
}

