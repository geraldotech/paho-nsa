# UI / UX:

- [x] filtro de TypeOfSubmission, que se comunica com o Search 
- [x] o que sai na lista tem que ser o resultado da combinação dos filtros (REVISADO 3 SELECTS)
- [x] no Search, trazer todos os resultados, porem mantendo a opcao de busca. Abaixar um pouco a lista para que se possa ver
- [x] quando eh progress report, e o financial some, o menu da esquerda tem que se ajustar
- [x] logo espanhol mudar pra espanhol (esta em portugues)
- [testar] há um lag ao carregar a página em root - talvez colocar um loading... (foi adicionado PromiseAll, efetuar o teste)
- [x] assegurar que try/catch esta ligado, caso algo falhe. Ver onde os fetch podem falhar e implementar try/catch
- [x] corrigir texto ao lado da logo: Non-State Actors Official Relations Portal to Non-State Actors in Official Relations Portal e em espanhol : Agentes No Estatales Portal de Relaciones Oficiales -> Portal de Agentes No Estatales en Relaciones Oficiales
- [x] tem que remover os titulos / ids do activity e workplan. isso eh pra uso interno somente
- [x] Assegurar que TODOS os Entity foram mudados de acordo. (eg: - cambiar Entity / Entidad -> Responsible Entity / Entidad Responsable)
- [x] Ao invés de "Identity" -> "Profile"
- [x] remover por completo o campo de "contact email"
- [x] o site tem que abrir em /official-relations
- [x] ao clicar no site do NSA, nao abre, verificar. As vezes so, exemplo: Global Alliance for Tobacco Control (GATC)
- [x] when input is empty get all  
- [x] quando e progress report ele não ta descendo/ancorando

- [x] hierarquia deve ser: 

•⁠  ⁠Profile
•⁠  ⁠Financial Information
•⁠  ⁠Collaboration with PAHO
  - Past Activities / Activities carried out in the past three years
  - Workplan (next 3 years) / Workplan for the next three years

# CAMPOS VINDO EM BRANCO: 

- [x] PAHO focal point ... este aqui nao ta vindo. Pendente c Eduardo
- [x] NSA focal point
- [x] Contact email ... nao esta vindo, porem deve ser removido
- [x] Organization type
- [x] Collaboration period ... este aqui nao ta vindo. Pendente c Eduardo
- [x] Type of submission

# 27/2

- [x] NSA Focal Point: encontra-se em "NSAFocalPoint". Pode estar em workplan.json ou activity.json
- [x] CollaborationPeriod: tem 2 subtitulos
    - [x] SUBTITULO 1: Activities carried out in the past three years / Actividades realizadas en los últimos tres años
        - jalar Description
        - a ordem e: Description.. hay un order, chequear documento
        - RENEWAL:
        - umbrella em StrategicPlan y HealthAgenda
    - [ ] SUBTITULO 2: o texto ta ok.

    - Workplan is good. just need to become sub of CollaborationPeriod
    - Collaboration with PAHO: this is the only thing that shows. Don't show Workplan. Only the most recent year

- [ ] Status: Completed only nsas filter

- [x] Sempre que houver `<a`, adicionar `rel="noreferrer"` ao lado, exemplo: 
    ```html
    <dd><a href="${nsa.NSAWebsite}" target="_blank" rel="noreferrer">${nsa.NSAWebsite}</a></dd>
    ```
- [x] Revisar se funcoes podem ser eliminadas (por falta de uso). Limpeza geral
- [-] trocar todos os `./` por `/` quando eu fiz isso quebrou!!

- [x] nsa.json
	- [] CollabWPActStrategicPlan (mais um card)
	- [x] CollabWPActHealthAgenda (a implementar new card) 1

- [] workplan.json 
	- [] StrategicPlanENG (mais um card)
	- [x] HealthAgenda (a implementar new card) 1

- [x] e quando for progress report, as activities estao no (workplan.json)
    - [ ] adicionar ProgressReport (workplan.json)


# ============

# DATA/INTEGRATION problems (ERIC):

- [ ] revisar progress report, pq vem zoado? 
- [ ] Em certos momentos (ou sempre?) o progress report nao vem com o workplan
- [ ] olhar CollabWPActStrategicPlan e CollabWPActHealthAgenda pode ser util ...  A questao do umbrella
- [ ] security patches
- [ ] abrir no /official-relations