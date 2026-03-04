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
    - [ ] SUBTITULO 1: Activities carried out in the past three years / Actividades realizadas en los últimos tres años
        - jalar Description
        - a ordem e: Description.. hay un order, chequear documento
        - RENEWAL:
        - umbrella em StrategicPlan y HealthAgenda
    - [x] SUBTITULO 2: o texto ta ok.

    - Workplan is good. just need to become sub of CollaborationPeriod
    - Collaboration with PAHO: this is the only thing that shows. Don't show Workplan. Only the most recent year

- [x] Status: Completed only
- [x] Sempre que houver `<a`, adicionar `rel="noreferrer"` ao lado, exemplo: 
    ```html
    <dd><a href="${nsa.NSAWebsite}" target="_blank" rel="noreferrer">${nsa.NSAWebsite}</a></dd>
    ```
- [x] Revisar se funcoes podem ser eliminadas (por falta de uso). Limpeza geral
- [x] trocar todos os `./` por `/`

# ============

# DATA/INTEGRATION problems (ERIC):

- [x] revisar progress report, pq vem zoado? 
- [x] Em certos momentos (ou sempre?) o progress report nao vem com o workplan
- [x] olhar CollabWPActStrategicPlan e CollabWPActHealthAgenda pode ser util ...  A questao do umbrella
- [x] security patches

# ============

# LAST REVISION

- [ ] abrir no /official-relations
- [x] Trocar string: Main work activities -> Main areas of work (espanhol ta ok)
- [x] Na parte "Governance & formal relations", os subtitulos devem ser: 
    1: Governing body members and affiliations / Miembros y afiliaciones del órgano rector
    2: UN & NGOs in Formal Relations with the NSA / Naciones Unidas y ONG en relaciones formales con la NSA
- [x] labels: trazer os bullet points um pouco pra direita(?)
- [x] em "NSA Profile" remover "Planned activities and expected results for the selected cycle."
- [x] "Activities carried out in the past three years." tem que ir acima do Goals/Strategic Plan. 
- [x] Quando for "Progress Report", também tem que estar acima do "Goals/Strategic Plan", porém o titulo muda para: "Activities carried out over the past year". Na versão Espanhol ficou 'Actividades realizadas durante el último año'
- [x] E quando for "New Application", mantê-lo também acima de "Goals/Strategic Plan", porém o subtitulo é: "Activities carried out over the past two years"  Na versão Espanhol ficou 'Atividades realizadas nos últimos dois anos'
- [ ] Replace "Goals" por "Sustainable Health Agenda for the Americas 2018–2030" / "Agenda de Salud Sostenible para las Américas 2018–2030" 
- [ ] Replace "Strategic Plan" por "PAHO Strategic Plan 2020 - 2025" / "Plan Estratégico de la OPS 2020–2025"
- [ ] Para ambos Activity e Workplan, a ordem deve ser Description of activity, Direct results, Responsible entity
    - [ ] em activity.json:
        1: "Description" (Description:)
        2: "DirectResults" (Direct Results:)
        3: "Entity" (Responsible Entity:)
        nota: assegurar que o texto esta em negrito
    - [ ] em workplan.json:
        1: "Description" (Description)
        2: "ExpectedResults" (Expected Results)
        3: "ResponsibleEntity" (ResponsibleEntity)
- [ ] Logo acima do "NSA Profile", colocar a mesma "Note: The information has been provided direclty...". Manter a original tambem, so agregar mais uma la em cima.
- [ ] Verificar que o numero de todas as barras saiam corretamente. Por exemplo: APHA - barra laranja
- [ ] Quando é "New Application", a parte do Workplan está vindo vazia. Exemplo: Clean Air Institute (CAI) 
- [ ] Na parte de Workplan, não deve sair este "Health Agenda: -". Deve remover "Health Agenda: -". 
    nota: em geral, essa ordem aplica-se pra tudo
- [ ] Claro -> Limpiar
- [ ] Quando for "Progress Report", não mostrar as seções "Description" & "Governance & formal relations". Por exemplo, o APHA, que é um Progress Report, não deve mostrar estas seções: 
<img width="2718" height="1330" alt="image" src="https://github.com/user-attachments/assets/58d6fe40-a5eb-4a9f-88d7-6336925119c6" />



### ATE AQUI
### ATE AQUI
### ATE AQUI



- [ ] O guarda-chuva em cima de "Activities" está ok. Devemos ter outro para "Workplan". O combo de Goals e Strategic Plan são diferentes para cada um.

- [ ] Quando for "Progress Report", remover esta parte "user has provided the following results". Lembrar que a mesma ordem tem que aparecer aqui tambem eg: 
    1: "Description" (Description)
    2: "ExpectedResults" (Expected Results)
    3: "ResponsibleEntity" (ResponsibleEntity)
