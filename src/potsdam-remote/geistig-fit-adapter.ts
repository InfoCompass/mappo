import { type Adapter, AdapterMeta, Item } from "@mappo-aggregato/mappo-aggregato"
import { Observable, of } from "rxjs"
import { parse } from "jsr:@std/xml"
import { assert } from "jsr:@std/assert/assert"

import {
	BlobReader,
	ZipReader,
	Entry
} from "jsr:@zip-js/zip-js"



export class GeistigFitAdapter implements Adapter {

	protected	url			:	string

	public 		meta 		:	AdapterMeta	
	public 		schedule	:	Observable<void>

	constructor(config : { meta: AdapterMeta, url: string, schedule: Observable<void>} ){
		this.meta 		= config.meta
		this.url 		= config.url //'https://www.google.com/maps/d/kml?mid=1f5Oh8PXvI3bzhcZ2DfAJGQVaZiVD9AU'
		this.schedule 	= config.schedule
	}	

	async getRawData() : Promise<{ name?: string, placemarkers: { name?: string, description?:string, coordinates?: string}[] }[]> {

		const response 		= 	await fetch(this.url)
		const zipFileReader	= 	new BlobReader(await response.blob())
		const zipReader		= 	new ZipReader(zipFileReader)
		const dataStream	= 	new TransformStream();
		const entries		= 	await zipReader.getEntries()
		const kmlEntry		= 	entries.find( (entry: Entry	) => entry.filename === "doc.kml")

		assert(kmlEntry, 				`Unable to extract kml entry from ${this.url}`)
		assert('getData' in kmlEntry, 	`Entry for doc.kml has no .getData method.`)

		kmlEntry.getData(dataStream)
		
		const xml 			= parse(await new Response(dataStream.readable).text())


		const document 		= xml.root.children.find( child => 'name' in child && child.name.raw === 'Document')

		assert(document,				'Unable to find Document in XMl.')
		assert('children' in document,	'Document has no children.')

		const elements		= document.children.filter( child => child.type === 'element') 
		const folders		= elements.filter( element => element.name.raw === 'Folder')

		const result		= folders.map( folder => {
								const elements				= 	folder.children.filter( child => child.type === 'element')
								const nameElement			= 	elements.find( element => element.name.raw === 'name')
								const name					= 	nameElement?.children.map( child => 'text' in child  ? child.text : '').join(' ') 
								const placemarkerElements 	= 	elements.filter( element => element.name.raw === 'Placemark')
								const placemarkers			= 	placemarkerElements.map( placemarkerElement => {

																	const childElements 		= 	placemarkerElement.children.filter( child => child.type === 'element')

																	const nameElement			= 	childElements
																									.find( element => element.name.raw === 'name')

																	const name					= 	nameElement?.children
																									.map( element => 'text' in element ? element.text.trim() : '').join(' ')

																	const descriptionElement	= 	childElements
																									.find( element => element.name.raw === 'description')

																	const description			= 	descriptionElement?.children
																									.map( element => 'text' in element ? element.text.trim() : '').join(' ')	

																	const pointElement			= 	childElements
																									.find( element => element.name.raw === 'Point')

																	const coordinatesElement	= 	pointElement?.children
																									.filter( child => child.type === 'element')
																									.find( element => element.name.raw === 'coordinates')

																	const coordinates			=	coordinatesElement?.children.map( child => 'text' in child ? child.text.trim() : '').join(' ')								

																	return  {name, description, coordinates}
																})

								return {name, placemarkers}
							})


		return result

	}

	async collectAndAdapt() : Promise<Item[]> {

		const rawData 		= await this.getRawData()

		const items			: Item[]
							= []

		const missingData	: Record<string, string[]>
							= {}				

		for await (const folder of rawData){

			const folderName	= folder.name
			const placemarkers 	= folder.placemarkers

			for await (const placemarker of placemarkers){

				//TODO check if data is present

				const preId 			= 	[folderName, placemarker.name, placemarker.coordinates].join('')
				const buffer 			= 	new TextEncoder().encode(preId)
    			const hash 				= 	await crypto.subtle.digest('SHA-256', buffer)
				const id 				= 	btoa(String.fromCharCode(...new Uint8Array(hash)))
			        						.replace(/[^a-zA-Z0-9]/g, '')
			        						.substring(0, 16)

				const match				=	placemarker.name?.match(/^\s*(.*?)\s*(\d\d.\d\d.\d\d\d\d)\s*$/)
				const cityFromName		= 	match && match[1]
				const dateString 		= 	match && match[2]

				const coordinates		=	placemarker.coordinates?.split(',').map(parseFloat) || []
				const longitude			=	coordinates[0]
				const latitude			=	coordinates[1]

				const markerDescription	=	placemarker.description || ''					

				const parts				=	markerDescription
											.split(/(?:<[^>]*?>)|,/)
											.map( p => p.trim() )
											.filter( x => !!x)

				const timePart			=	parts.find( p => p.match(/\d\d(?::|\.)\d\d.*\d\d(?::|\.)\d\d/) )
				const timeMatch			=	timePart?.match(/(\d\d(?::|\.)\d\d).*(\d\d(?::|\.)\d\d)/)
				const startTime			=	timeMatch && timeMatch[1].replace('.', ':')
				const endTime			=	timeMatch && timeMatch[2].replace('.', ':')

				const streetPart		=	parts.find( p => p.match(/[a-zA-Z.]+\s*\d+[a-zA-Z]?$/))
				const cityPart			=	parts.find( p => p.match(/^\s*\d{5}\s*[^\d]*$/))
				const cityMatch			=	cityPart && cityPart.match(/^\s*(\d{5})\s*([^\d]*)\s*$/)
				const zip				=	cityMatch && cityMatch[1]
				
				const city				=	cityMatch && cityMatch[2] || cityFromName

				const state 			=	"draft" //TODO set to "public"

				const locationParts		=	parts.slice(timePart ? parts.indexOf(timePart)+1 : 0, streetPart ? parts.indexOf(streetPart) : -1)
				const location			=	locationParts.join(', ')


				const recurring_event	=	dateString && JSON.stringify([['fixed', null, startTime, endTime, dateString.split('.').reverse().join('-')]])

				const title				=	"Geistig fit bleiben – mit 10 Maßnahmen Demenz vorbeugen"

				const brief				=	{ de: "Vortrag zur Förderung der geistigen Gesundheit"}
				const tags				=	['event', 'care', 'care_dementia']

				const description		=	{ de:`
													${markerDescription ? markerDescription + '<hr/>' : ''}

													Prävention wird ein immer wichtigeres Thema bei Demenz. Wir alle wünschen uns im Alter nicht nur körperlich, sondern auch geistig fit zu sein. Doch was können wir aktiv dafür tun, um unser Gehirn lange leistungsfähig und gesund zu halten?

													„Geistig fit – mit 10 Maßnahmen Demenz vorbeugen“ ist ein innovativer Vortrag zur Förderung der geistigen Gesundheit und zur Vorbeugung von Demenz. Sie erfahren, wie spannend und komplex unser Gehirn funktioniert, wie Demenzerkrankungen unser Gehirn schädigen und was wir aktiv tun können, um unser Gehirn lange fit zu halten. Ziel ist es, Menschen zu sensibilisieren und ihnen praxisnahe Strategien zu vermitteln. Im Anschluss an den Vortrag stellen sich ortsansässige Initiativen vor, die bei einem aktiven und gesunden Lebensstil unterstützen. 

													Das Angebot richtet sich an Bürgerinnen und Bürger, vor allem im mittleren und höheren Alter, die sich für das Thema geistige Gesundheit interessieren und durch vorbeugende Maßnahmen aktiv zu ihrer mentalen Gesundheit beitragen möchten.

												`
											}

				const item 				=	{
												id,
												title,
												description,
												brief,
												tags,
												dateString,
												latitude,
												longitude,
												startTime,
												endTime,
												location,											
												zip,
												city,
												recurring_event,
												state
											}

				for(const prop in item)	if(!item[prop as keyof typeof item]){
					missingData[placemarker.name || id] = missingData[placemarker.name || id] || []
					missingData[placemarker.name || id].push(prop)
					delete item[prop as keyof typeof item]
				}

				items.push(item)

			}
		}

		if(Object.keys(missingData).length != 0) console.warn('Some items from GeistigFit are missing data:', missingData)


		return items


		throw new Error("No items in response. Maybe you used api. subdomain instead of public. subdomain?")	

	}

}
