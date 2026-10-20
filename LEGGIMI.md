# Foto Cantiere — guida

App web installabile su iPhone e Android: si apre dal browser e si aggiunge alla schermata Home. Funziona come un'app, senza passare dagli store.

## Cosa fa

### Scatto libero e verifica delle note (versione 2.4)

Il punto sulla planimetria è facoltativo per scatto singolo, importazione dalla galleria e fotocamera continua. L'app parte in modalità senza punto, salvo una planimetria scelta in precedenza. Anche con una planimetria aperta si può scattare subito senza toccarla: in questo caso la foto non riceve né planimetria né coordinate. Per associare un punto basta toccare la pianta; «Scatta senza punto» rimuove il punto corrente.

Nel dettaglio della foto, «Salva nota e sincronizza» distingue il salvataggio locale dalla verifica sul file Drive. Finché la coda non è vuota per quella foto non viene dichiarata la sincronizzazione. «Verifica nota su Drive» rilegge il file e controlla la corrispondenza della descrizione; eventuali differenze, vecchi formati, assenza di rete o errori sono indicati esplicitamente. «Apri foto su Drive» porta al file corretto.

**Dove leggere la nota su Drive:** aprire la foto → menu **File → Dettagli → Descrizione**. La nota è una descrizione del file, non un testo stampato sopra l'immagine nell'anteprima.

### Descrizioni delle foto su Drive (versione 2.3)

La nota inserita nell'app è salvata come testo leggibile nel campo **Descrizione** del file fotografico su Google Drive. Anche una nota vuota viene sincronizzata correttamente. Nome e contenuto dell'immagine non cambiano.

Numerazione, data, autore, identificativo della foto, posizione e direzione sulla planimetria restano nelle proprietà private `appProperties` del file, in un formato versionato. Si conservano anche eventuali campi storici non riconosciuti. La nuova app legge sia questo formato sia il JSON delle versioni precedenti; dati tecnici incompleti o eccessivamente lunghi producono un errore, senza troncamenti o sovrascritture silenziose.

Per le foto già presenti, i due utenti creatori trovano in **Impostazioni → Aggiorna descrizioni foto su Drive** il comando che accoda l'aggiornamento dei metadati. Non modifica immagini, nomi, note, gruppi o condivisioni; ignora le foto già aggiornate e quelle con operazioni ancora in attesa. Controllare la coda per confermare il completamento.

**Dopo questo aggiornamento ricaricare l'app su tutti i dispositivi** e chiudere eventuali schede delle versioni precedenti, che non conoscono il nuovo formato. Le vecchie cache dei dati sono aggiornate alla successiva lettura da Drive. Come già avveniva, modifiche contemporanee allo stesso elemento non sono una modifica collaborativa in tempo reale.

- **Cantieri**, ciascuno con nome, indirizzo, committente e intestazione del rapporto (il tuo nome o lo studio, a seconda dell'incarico).
- **Planimetrie** del cantiere: si caricano in formato JPG, PNG o PDF. Del PDF si sceglie la pagina.
- **Gruppi di foto** con titolo, data e descrizione.
- **Scatto con o senza punto sulla planimetria**: puoi scattare subito senza posizione; facoltativamente tocchi la pianta dove ti trovi, indichi la direzione e scatti quante foto vuoi da quel punto. Ogni foto ha una nota modificabile.
- **Senza rete**: le foto restano in coda sul telefono e si caricano da sole quando torna la connessione.
- **Rapporto fotografico PDF**: intestazione, dati del cantiere, descrizione e planimetria con i numeri delle foto e le frecce di direzione. Seguono le foto numerate con data, ora, autore e nota, impaginate a 2, 4 o 6 per pagina. In fondo c'è lo spazio per la firma. Il rapporto si condivide, si stampa o si salva nella cartella del gruppo su Drive.
- **Archivio su Google Drive**: ogni cantiere è una cartella e ogni gruppo una sottocartella. Le foto sono file JPG normali, consultabili anche da Drive.

## Configurazione attuale (in uso)

| Voce | Valore |
|---|---|
| Indirizzo dell'app | https://purarchitettura.github.io/app-cantiere/ |
| Informativa privacy | https://purarchitettura.github.io/app-cantiere/privacy.html |
| Account Google proprietario | contact@purarchitettura.it |
| Progetto Google Cloud | App cantiere (`app-cantiere-512109`), accesso **In produzione** |
| Cartella archivio | «Foto Cantiere - Archivio» nel Drive di contact@purarchitettura.it |

## Chi può usarla

L'accesso ai dati dipende dalle condivisioni su Google Drive. La creazione dei cantieri nell'app è riservata agli account abilitati qui sotto.

### Creazione cantieri e accesso riservato (versione 2.2)

Nell'app possono creare nuovi cantieri esclusivamente questi account:

- `contact@purarchitettura.it`
- `geometrailariocorro@gmail.com`

L'elenco è in `CONFIG.CANTIERE_CREATORS` di `index.html`. Per cambiarlo serve un aggiornamento del codice; non è presente una schermata di gestione utenti. Anche gli utenti abilitati devono avere il permesso di aggiungere cartelle nell'archivio su Drive.

Gli altri utenti vedono esclusivamente i cantieri assegnati in `CONFIG.CANTIERE_ACCESS` e realmente accessibili su Drive. L'assegnazione corrente è **ilario.cor87@gmail.com → Playa** (ID `1x8GdD1qM3QExkWT8Fnoh8sXv2oL91h1H`). Non vengono cercati né enumerati gli altri cantieri per questi account. Gli utenti senza assegnazioni non vedono alcun cantiere.

Nei cantieri assegnati, un **Editor** può aggiungere gruppi e foto; un **Visualizzatore** può solo consultare. La cartella archivio non deve essere condivisa con i collaboratori: il login funziona anche con il solo accesso diretto al cantiere.

Per applicare il vincolo anche direttamente su Drive, configura le condivisioni così:

1. I due creatori sono Proprietario/Editor della cartella «Foto Cantiere - Archivio».
2. Gli altri utenti non hanno alcuna condivisione della cartella archivio, neppure come Visualizzatori.
3. Condividi esclusivamente le cartelle dei cantieri assegnati come Editor con chi deve aggiungervi gruppi e foto.
4. Registra gli ID delle cartelle assegnate per ciascuna email in `CONFIG.CANTIERE_ACCESS` e pubblica l'aggiornamento. Non è presente una schermata di gestione delle assegnazioni.

L'app controlla l'accesso nella lista iniziale, nella ricerca, nell'apertura di cantiere/gruppo/foto/storico e nel ripristino delle schermate. All'avvio e al ritorno nell'app verifica di nuovo l'accesso Drive. La vecchia cache globale non concede accesso a un nuovo account; gli elenchi offline verificati sono separati per email. Una revoca rilevata online rimuove il cantiere dalla vista e dalla ricerca.

**Confine di sicurezza:** le assegnazioni nel codice limitano l'app, mentre i permessi Google Drive proteggono i file anche fuori dall'app. Non condividere l'intero archivio con i collaboratori e rimuovi eventuali condivisioni dirette, per gruppo/dominio o tramite link che concedano accesso a cantieri non assegnati. La pubblicazione del codice non cambia automaticamente le condivisioni esistenti.

Offline si usano le assegnazioni correnti nel codice e gli accessi già verificati per l'account; una revoca su Drive non è conoscibile finché manca la rete. Non è possibile ritirare copie già scaricate o esportate. Drive ricontrolla i permessi effettivi durante la sincronizzazione. Una revoca può lasciare operazioni in coda, senza cancellarne i dati. L'aggiornamento non elimina né migra cantieri, gruppi, foto o code esistenti.

### Permessi Google Drive di base

- condivisa come **Editor**: la persona può consultare, scattare e caricare;
- condivisa come **Visualizzatore**: la persona può solo consultare;
- non condivisa: l'app rifiuta l'accesso, anche se la persona ha un account Google.

**Aggiungere un collaboratore**: condividi soltanto il cantiere assegnato su Drive, aggiungi email e ID in `CONFIG.CANTIERE_ACCESS` e pubblica il codice. Non condividere la cartella archivio.
**Togliere un utente**: rimuovi l'assegnazione nel codice e la condivisione su Drive, verificando anche eventuali accessi per link/gruppo/dominio. Le foto che ha già caricato restano nell'archivio.

Ogni utente deve avere un account Google (Gmail o Google Workspace). Al primo accesso Google mostra l'avviso «Google non ha verificato questa app»: si prosegue con *Avanzate* → *Vai a App Cantiere*. L'avviso compare perché l'app è privata e non è stata sottoposta alla verifica di Google, che per un uso interno non serve. Google consente a un'app non verificata al massimo 100 utenti nuovi in tutto.

## Aggiornamenti senza perdita di dati

L'archivio è su Google Drive, fuori dall'app. Un aggiornamento cambia solo il codice e non può cancellare cantieri, gruppi, foto, planimetrie o rapporti. In particolare:

- i dati di ogni elemento sono salvati su Drive insieme al file. Gli aggiornamenti li leggono così come sono: si aggiungono campi nuovi, non si rinominano né si eliminano quelli esistenti;
- le foto in coda sul telefono, non ancora caricate, restano in coda anche dopo un aggiornamento e partono appena c'è rete;
- le eliminazioni avvengono solo su tua richiesta e spostano nel cestino di Drive, da cui si recuperano per 30 giorni;
- le regole da rispettare in ogni modifica futura sono scritte all'inizio del codice (`index.html`, sezione «Regole per gli aggiornamenti»);
- **non cambiare** `ROOT_FOLDER_ID` in `index.html`: l'app mostrerebbe un archivio vuoto. I dati resterebbero comunque su Drive, ma andrebbero spostati.

Per aggiornare: carica il nuovo `index.html` (ed eventuali altri file) nel repository con *Add file → Upload files*. Il telefono riceve la nuova versione alla prima apertura con rete. La versione in uso è indicata in fondo a Impostazioni.

## Attivazione da zero (già fatta, serve solo per rifare l'impianto)

### 1. Pubblica i file su un indirizzo https gratuito

La fotocamera e l'installazione sul telefono richiedono un indirizzo **https**. Ad esempio, con GitHub Pages:

1. crea un account su github.com e un repository, ad esempio `foto-cantiere`;
2. carica tutti i file di questa cartella: `index.html`, `manifest.json`, `sw.js` e le icone `.png`;
3. in *Settings → Pages* scegli il ramo `main` e salva.

L'indirizzo sarà del tipo `https://TUONOME.github.io/foto-cantiere/`. Annotalo **esattamente**, compresa la barra finale.

### 2. Crea l'accesso Google (Google Cloud, gratuito)

1. Vai su console.cloud.google.com e crea un progetto, ad esempio "Foto Cantiere".
2. In *API e servizi → Libreria* abilita **Google Drive API**.
3. Apri **Google Auth Platform**, raggiungibile anche da console.developers.google.com/auth/clients:
   - **Branding**: nome dell'app e la tua email;
   - **Pubblico** (*Audience*): tipo **Esterno**, stato **Test**. In *Utenti di test* aggiungi le email di tutte le persone autorizzate;
   - **Client** → *Crea client* → tipo **Applicazione web**:
     - *Origini JavaScript autorizzate*: `https://TUONOME.github.io`
     - *URI di reindirizzamento autorizzati*: `https://TUONOME.github.io/foto-cantiere/`, cioè l'indirizzo del passo 1.
4. Copia l'**ID client**, che termina con `.apps.googleusercontent.com`. Il "client secret" non serve.

Le modifiche su Google possono richiedere da qualche minuto ad alcune ore per diventare attive. Al primo accesso Google può mostrare un avviso di app non verificata. È normale per un'app privata in stato di test: si prosegue da *Avanzate*.

### 3. Crea la cartella archivio su Google Drive

1. Nel tuo Drive crea una cartella, ad esempio `Foto Cantiere - Archivio`.
2. Condividila come **Editor** con chi deve scattare e come **Visualizzatore** con chi deve solo consultare.
3. Apri la cartella e copia l'ID dall'indirizzo: è la parte dopo `/folders/`.

### 4. Inserisci i due codici nell'app

Apri `index.html` con un editor di testo e cerca il blocco `CONFIG` all'inizio dello script:

```js
CLIENT_ID: 'xxxxxxxx.apps.googleusercontent.com',
ROOT_FOLDER_ID: 'ID della cartella del passo 3',
ALLOWED_EMAILS: ['geometrailariocorro@gmail.com', 'collega@esempio.it'],   // facoltativo
```

Ricarica il file su GitHub. Finché `CLIENT_ID` e `ROOT_FOLDER_ID` sono vuoti, l'app funziona in **modalità prova**, con i dati solo sul telefono.

### 5. Installala sul telefono

- **iPhone**: apri l'indirizzo con **Safari** → pulsante Condividi → *Aggiungi alla schermata Home*.
- **Android**: apri l'indirizzo con **Chrome** → menu ⋮ → *Installa app* (o *Aggiungi a schermata Home*).

## Uso in cantiere

1. Apri il cantiere e, la prima volta, carica la planimetria dalla scheda *Planimetrie*.
2. Crea un gruppo, ad esempio "Sopralluogo impianti", con la descrizione.
3. Tocca **Scatta foto** e scatta subito senza punto. Se vuoi registrare la posizione, scegli la planimetria, toccala nel punto in cui ti trovi e, facoltativamente, scegli *Indica direzione*.
4. Per cambiare posizione tocca di nuovo la pianta o *Nuovo punto*.
5. Dal gruppo: **Rapporto** → scegli l'impaginazione → *Crea PDF* → condividi, stampa o salva su Drive.

## Da sapere

- **Accesso**: Google fa durare l'accesso circa un'ora. L'app lo rinnova da sola, senza chiedere nulla: all'apertura, quando ci torni, e quando serve durante l'uso. Dopo il rinnovo ti riporta al cantiere o al gruppo in cui eri. Non lo rinnova mentre stai scattando o modificando una foto, per non interromperti. Se Google chiede una conferma, il pallino in alto diventa arancione: toccandolo si riattiva l'accesso e i caricamenti ripartono. Nel frattempo le foto restano in coda sul telefono.
- **Numerazione delle foto**: ogni foto riceve allo scatto un numero progressivo del cantiere (1, 2, 3… su tutti i gruppi). Il numero non cambia se aggiungi o elimini altre foto, quindi si può citare nei verbali («foto n. 37»). Le foto eliminate lasciano un buco nella numerazione. Se due persone scattano nello stesso momento senza rete, in rari casi possono ottenere lo stesso numero.
- **Storico di un punto**: tocca un segnaposto sulla planimetria di un gruppo → *Storico del punto*. In alternativa, dalla scheda Planimetrie → *Storico dei punti*, o dalla foto → *Storico del punto*. Vedi tutte le foto scattate in quel punto, in tutti i sopralluoghi, in ordine di data. Le foto a pochi centimetri di distanza sulla pianta contano come lo stesso punto.
- **Rapporto in Word**: nel rapporto scegli *Formato → Word .docx*. Il file si apre e si modifica con Word, Pages, Google Documenti o LibreOffice e contiene gli stessi elementi del PDF: intestazione, dati, descrizione, planimetria con i punti, foto con didascalie, firma e numero di pagina.
- **Ricerca**: con la lente nella schermata Cantieri cerchi in tutto l'archivio: nome, indirizzo e committente del cantiere, titolo e descrizione dei gruppi, note delle foto, nomi delle planimetrie e date (es. 18/10/2026). Più parole restringono la ricerca. Senza rete cerca nei dati già salvati sul telefono.
- **Copia sul telefono**: l'app tiene una copia delle foto per lavorare senza rete. In *Impostazioni → Libera spazio* si cancella la copia locale, mentre le foto restano su Drive. Dal menu di un gruppo, *Salva le foto sul telefono* le mette nella Galleria o in Foto.
- **Eliminazioni**: le cartelle e le foto eliminate finiscono nel cestino di Google Drive. Se Drive non permette a un collaboratore di eliminare un file caricato da altri, l'app lo segnala nella coda e l'operazione si può annullare.
- **Qualità delle foto**: lo standard è 2048 px sul lato lungo, modificabile in *Impostazioni*. L'app ricomprime le foto per risparmiare spazio su Drive e velocizzare i caricamenti.
- **Costi**: GitHub Pages, Google Cloud (per questo uso) e lo spazio Drive del piano gratuito non hanno costi. Lo spazio occupato dalle foto conta sulla quota Drive di chi le carica.

