import nasas from '../database/nsas.js' // ID
import activity from '../database/activity.js' // ParentID
import workplan from '../database/workplan.js' // ParentID

const DISCLAIMER = {
  en: 'The information has been provided directly by Non-State Actors (NSAs) as part of their reporting obligations within the framework of official relations. In accordance with the consent granted by each NSA, the data is declarative in nature and may be published for transparency purposes. PAHO is not responsible for verifying, auditing, or editing the information provided.',
  es: 'La información ha sido proporcionada directamente por los Agentes No Estatales (ANE) como parte de sus obligaciones de reporte en el marco de las relaciones oficiales. De conformidad con el consentimiento otorgado por cada ANE/NSA, los datos son de carácter declarativo y podrán ser publicados para fines de transparencia. La OPS no es responsable de verificar, auditar ni editar la información proporcionada.',
}

let state = {
  lang: 'en',
}

/**
 * @author GeraldoDEv
 * @since Fev, 21, 2026
 * @REGRAS DE NEGOCIO - FILTROS A SEREM APLICADOS
 * @PROCURAR OS JSONS E IDs relacionados
 */

/**
 * BUSCA POR QUERY PARAMS
 */
const id = '62'

//  NSA
const nsa = nasas.find((n) => String(n.ID) === id)
// atividades
const activities = activity.filter((a) => String(a.ParentID) === id)
// workplans
const workplans = workplan.filter((w) => String(w.ParentID) === id)

// todos os Ids
const nasasIds = nasas.map((value) => value.ID)

console.log(nasasIds)
console.log(nsa)
console.log(activities)
console.log(workplans)

/* const baseurl = 'https://api-restful-json.vercel.app/posts'

fetch(`${baseurl}`)
  .then((res) => {
    if (!res.ok) {
      throw new Error(`Erro na requisição: ${res.status}`)
    }
    return res.json() // return as JSON
  })
  .then((data) => {
    console.log(data) // ✅ Dados válidos
  })
  .catch((error) => {
    console.error('Erro ao buscar', error)
  })
 */
