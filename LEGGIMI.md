# Foto Cantiere — guida all'attivazione

App web installabile su iPhone e Android: si apre dal browser e si aggiunge alla schermata Home. Funziona come un'app, senza passare dagli store.

## Cosa fa

- **Cantieri**, ciascuno con nome, indirizzo, committente e intestazione del rapporto (il tuo nome o lo studio, a seconda dell'incarico).
- **Planimetrie** del cantiere: si caricano in formato JPG, PNG o PDF. Del PDF si sceglie la pagina.
- **Gruppi di foto** con titolo, data e descrizione.
- **Scatto con punto sulla planimetria**: tocchi la pianta dove ti trovi, indichi se vuoi la direzione in cui punti il telefono, poi scatti quante foto vuoi da quel punto. Ogni foto ha una nota modificabile.
- **Senza rete**: le foto restano in coda sul telefono e si caricano da sole quando torna la connessione.
- **Rapporto fotografico PDF**: intestazione, dati del cantiere, descrizione e planimetria con i numeri delle foto e le frecce di direzione. Seguono le foto numerate con data, ora, autore e nota, impaginate a 2, 4 o 6 per pagina. In fondo c'è lo spazio per la firma. Il rapporto si condivide, si stampa o si salva nella cartella del gruppo su Drive.
- **Archivio su Google Drive**: ogni cantiere è una cartella e ogni gruppo una sottocartella. Le foto sono file JPG normali, consultabili anche da Drive.

## Chi può usarla

Entra solo chi soddisfa **tutte e tre** le condizioni:

1. l'indirizzo email è tra gli **utenti di test** del progetto Google Cloud (passo 2);
2. la **cartella Drive** dell'archivio è condivisa con quell'account (passo 3);
3. l'indirizzo è nell'elenco `ALLOWED_EMAILS` del file `index.html`, se decidi di compilarlo. È facoltativo.

Ogni utente deve avere un account Google (Gmail o Google Workspace). Chi ha la cartella condivisa come **Visualizzatore** può solo consultare. Chi la ha come **Editor** può anche scattare e caricare.

## Attivazione (una volta sola, circa 30 minuti)

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
3. Tocca **Scatta foto**. Tocca la pianta nel punto in cui ti trovi e, se vuoi, *Indica direzione*. Poi scatta.
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
