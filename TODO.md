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

- [x] Trocar string: Main work activities -> Main areas of work (espanhol ta ok)
- [x] Na parte "Governance & formal relations", os subtitulos devem ser: 
    1: Governing body members and affiliations / Miembros y afiliaciones del órgano rector
    2: UN & NGOs in Formal Relations with the NSA / Naciones Unidas y ONG en relaciones formales con la NSA
- [x] labels: trazer os bullet points um pouco pra direita
- [x] em "NSA Profile" remover "Planned activities and expected results for the selected cycle."
- [x] "Activities carried out in the past three years." tem que ir acima do Goals/Strategic Plan. 
- [x] Quando for "Progress Report", também tem que estar acima do "Goals/Strategic Plan", porém o titulo muda para: "Activities carried out over the past year". 
- [x] E quando for "New Application", mantê-lo também acima de "Goals/Strategic Plan", porém o subtitulo é: "Activities carried out over the past two years"
- [x] Replace "Goals" por "Sustainable Health Agenda for the Americas 2018–2030" / "Agenda de Salud Sostenible para las Américas 2018–2030" 
- [x] Replace "Strategic Plan" por "PAHO Strategic Plan 2020 - 2025" / "Plan Estratégico de la OPS 2020–2025"
- [x] Para ambos Activity e Workplan, a ordem deve ser Description of activity, Direct results, Responsible entity
    - [x] em activity.json:
        1: "Description" (Description:)
        2: "DirectResults" (Direct Results:)
        3: "Entity" (Responsible Entity:)
        nota: assegurar que o texto esta em negrito
    - [x] em workplan.json:
        1: "Description" (Description)
        2: "ExpectedResults" (Expected Results)
        3: "ResponsibleEntity" (ResponsibleEntity)
- [x] Logo acima do "NSA Profile", colocar a mesma "Note: The information has been provided direclty...". Manter a original tambem, so agregar mais uma la em cima.
- [x] Verificar que o numero de todas as barras saiam corretamente. Por exemplo: APHA - barra laranja
- [x] Na parte de Workplan, não deve sair este "Health Agenda: -". Deve remover "Health Agenda: -". 
    nota: em geral, essa ordem aplica-se pra tudo
- [x] Claro -> Limpiar
- [x] remover o nome da pessoa que entrou

# LAST ROUND:

- [ ] O guarda-chuva em cima de "Activities" está ok. Devemos ter outro para "Workplan". O combo de Goals e Strategic Plan são diferentes para cada um.
    - [x] Para o "Activities carried out in the past three years", vem de
        - [x] card 1: Sustainable Health Agenda for the Americas 2018–2030. Fonte: CollabActHealthAgenda (nsa.json) (ou Eng / Spa)



        - [x] card 2: PAHO Strategic Plan 2020 - 2025. Fonte: CollabActStrategicPlan (nsa.json) (ou Eng/Spa)


    - [ ] Para o "Workplan for the next three years"
        - card 1: Sustainable Health Agenda for the Americas 2018–2030. Fonte: CollabWPActHealthAgenda (nsa.json) OU "HealthAgenda" (workplan.json) (ou Eng/Spa)
        - card 2: PAHO Strategic Plan 2020 - 2025. Fonte: CollabWPActStrategicPlan (nsa.json) OU "StrategicPlan" (workplan.json) (ou Eng/Spa)

- [x] Quando for "Progress Report", remover esta parte "user has provided the following results". Lembrar que a mesma ordem tem que aparecer aqui tambem eg: 
    1: "Description" (Description)
    2: "ExpectedResults" (Expected Results)
    3: "ResponsibleEntity" (ResponsibleEntity)

- [ ] activity ainda falta trocar "Entity" por "Responsible Entity". Dar uma conferida extra pra ver se todos os "Entity" foram trocados por "Responsible Entity" (tambem checar o espanhol: Entidad responsable)
- [ ] Algumas vezes, os campos do Workplan estao vindo vazios (testar com os tres tipos de submissao). Exemplo: Clean Air Institute (CAI) (ingles: ou Description ou DescriptionENG / espanhol: DescriptionESP somente) - se tiver vazio, so lamento
- [ ] Quando é "New Application", bajo "Colaboración con la OPS", "Atividades realizadas nos últimos dois anos" sale en Portugues. reemplazar por Espanol: "Actividades realizadas en los últimos dos años"
- [ ] Quando for Progress report, o disclaimer de baixo pode ser escondido. 
- [ ] Quando é Progress report, o Direct Results esta puxando de um campo equivocado. (ENG: DirectResults / DirectResultsENG .... SPA: DirectResultsSPA) fonte: activity.json
- [ ] Na parte de "Focal points": trocar "Focal point role" por "Focal point title", e em espanhol deve ser: "Cargo del punto focal"
- [ ] trocar string: Miembros y afiliaciones del órgano rector -> Miembros del órgano de governanza y afiliaciones
- [ ] trocar string: Naciones Unidas y ONG en relaciones formales con la NSA -> Naciones Unidas y ONG en relaciones formales con el ANE
- [ ] Quando põe-se a página em Espanhol, os nomes da NSA na parte de búsca também tem que estar em espanhol. No momento, está em inglês (ps: o titulo em espanhol vem de TitleENGSPA)
- [ ] Há casos em que há mais de um PAHO Focal Point. Nestes casos, temos que trazer todos, eg: Instituto del Aire Limpio. O mesmos nao acontece com a NSA, somente PAHO. 
- [ ] No filtro, Type of Submission tem que ser a primeira opção. Logo depois, Collaboration period, Organization type

### ATE AQUI

- [ ] abrir no /official-relations
- [ ] escapeHtml XSS
