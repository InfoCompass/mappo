
export async function fetchTranslations(translationsUrl:string) : Promise<Record<string, unknown>>{
	const translationsResult	= await fetch(translationsUrl)
	const translations			= await translationsResult.json()

	if(!translations || typeof translations != 'object') throw `Unable to fetch translations at ${translationsUrl}`

	return translations	
}



export function getTranslation(translations : unknown, path : string[], missingTranslationFallback : string | undefined = 'MISSING_TRANSLATION') : string | undefined {	
	if(path.length == 0) return String(translations)

	const [current, ...rest] = path
	const currentKey = current.toUpperCase()

	if(!translations)					return missingTranslationFallback	
	if(typeof translations != 'object') return missingTranslationFallback	
	if(!(currentKey in translations))	return missingTranslationFallback	

	const subtree = (translations as {[index:string]:unknown})[currentKey]

	return getTranslation(subtree, rest, missingTranslationFallback)

} 
