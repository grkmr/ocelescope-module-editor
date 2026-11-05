# TODO LIST

## Filter

- [x] alle events von der activity A mit mind. 1 E2O relation zu ienem object vom typ OT

- [ ] gegeben eine A2OT kombi: alle objekte die in einem event von typ A vorkommen welches mind. ein objekt vom typ OT hat.

- [ ] Filtern auf NA values

- [ ] rausschmeißen bei attribute + value kombinations

## Editor

- [x] umbenennen von aktivitäten & objekttypen

  - [x] attribute wert als type notion für alle wo der wert nicht NA ist (toggle NA droppen oder as is)

- [ ] trace-merger: ich gebe als input 1) setes von objekten und eine object id (darf nicht vorhanden sein (mapping: new object id -> set objects) und 2) ein mapping neue IDs + object type (darf schon vorhanden sein) und 3) (optional) eine vorhandene obvject ID von der die attribute kopiert werden (neue id auf altes object). für jede neue ID: für alle events in die mindestens eines der objekte im set involviert ist fügen wir ein neues objekt mit neuer object id, vom neuen object type und attribute werten vom optonalen koperten objekt hinzu.

- [x] Add o2o relations und add E2O relations.

- [ ] Add new object/add new event
