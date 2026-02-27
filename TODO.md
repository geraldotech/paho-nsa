# UI / UX:

- [x] filtro de TypeOfSubmission, que se comunica com o Search 
- [ ] o que sai na lista tem que ser o resultado da combinação dos filtros
- [ ] no Search, trazer todos os resultados, porem mantendo a opcao de busca. Abaixar um pouco a lista para que se possa ver
- [x] quando eh progress report, e o financial some, o menu da esquerda tem que se ajustar
- [x] logo espanhol mudar pra espanhol (esta em portugues)
- [ ] há um lag ao carregar a página em root - talvez colocar um loading...
- [x] assegurar que try/catch esta ligado, caso algo falhe. Ver onde os fetch podem falhar e implementar try/catch
- [x] corrigir texto ao lado da logo: Non-State Actors Official Relations Portal to Non-State Actors in Official Relations Portal e em espanhol : Agentes No Estatales Portal de Relaciones Oficiales -> Portal de Agentes No Estatales en Relaciones Oficiales
- [x] tem que remover os titulos / ids do activity e workplan. isso eh pra uso interno somente
- [ ] Assegurar que TODOS os Entity foram mudados de acordo. (eg: - cambiar Entity / Entidad -> Responsible Entity / Entidad Responsable)
- [ ] Ao invés de "Identity" -> "Profile"
- [ ] remover por completo o campo de "contact email"
- [ ] o site tem que abrir em /official-relations
- [ ] ao clicar no site do NSA, nao abre, verificar. As vezes so, exemplo: Global Alliance for Tobacco Control (GATC)
- [ ] when input is empty get all 
- [ ] quando e progress report ele não ta descendo/ancorando

- [ ] hierarquia deve ser: 

•⁠  ⁠Profile
•⁠  ⁠Financial Information
•⁠  ⁠Collaboration with PAHO
  - Past Activities / Activities carried out in the past three years
  - Workplan (next 3 years) / Workplan for the next three years

# CAMPOS VINDO EM BRANCO: 

- [ ] PAHO focal point ... este aqui nao ta vindo. Pendente c Eduardo
- [ ] NSA focal point
- [ ] Contact email ... nao esta vindo, porem deve ser removido
- [x] Organization type
- [ ] Collaboration period ... este aqui nao ta vindo. Pendente c Eduardo
- [x] Type of submission

# matar tudo ate aqui
# amanha comecamos do REGRAS DE NEGOCIO

# REGRAS DE NEGOCIO 

- [ ] CollaborationPeriod: tem 2 subtitulos
    - Past Activities / Actividades Pasadas (dentro: Activities carried out in the past three years / Actividades realizadas en los últimos tres años)
        - jalar Description
        - cambiar Entity / Entidad -> Responsible Entity / Entidad Responsable
        - a ordem e: Description.. hay un order, chequear documento
        - RENEWAL:
        - Plan de Trabajo hay un orden. ver documento.
        - umbrella em StrategicPlan y HealthAgenda

    - Workplan is good. just need to become sub of CollaborationPeriod
    - Collaboration with PAHO: this is the only thing that shows. Don't show Workplan. Only the most recent year

- [ ] Status: Completed only

# DATA/INTEGRATION problems (ERIC):

- [ ] revisar progress report, pq vem zoado? 
- [ ] Em certos momentos (ou sempre?) o progress report nao vem com o workplan
- [ ] olhar CollabWPActStrategicPlan e CollabWPActHealthAgenda pode ser util ...  A questao do umbrella
- [ ] security patches
- [ ] abrir no /official-relations