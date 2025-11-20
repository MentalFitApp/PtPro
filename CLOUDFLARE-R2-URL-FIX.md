# Fix Cloudflare R2 Public URL

## Problema
L'URL `https://media.flowfitpro.it` in `.env` non risolve (ERR_NAME_NOT_RESOLVED). Le immagini non si caricano.

## Soluzione

### Opzione 1: Usa l'URL pubblico standard di R2 (consigliato)

1. Vai su https://dash.cloudflare.com/
2. Apri **R2** → bucket **fitflow**
3. Vai su **Settings** → **Public Access**
4. Se non è già abilitato, clicca su **Allow Public Access**
5. Copia l'URL pubblico che viene mostrato (dovrebbe essere tipo `https://pub-<hash>.r2.dev`)
6. Aggiorna il file `.env`:
   ```bash
   VITE_R2_PUBLIC_URL=https://pub-<hash>.r2.dev
   ```

### Opzione 2: Configura il custom domain (avanzato)

Se vuoi usare `media.flowfitpro.it`:

1. Vai su https://dash.cloudflare.com/
2. Apri **R2** → bucket **fitflow** → **Settings** → **Custom Domains**
3. Clicca **Connect Domain**
4. Inserisci `media.flowfitpro.it`
5. Cloudflare creerà automaticamente un record DNS CNAME
6. Attendi la propagazione DNS (può richiedere alcuni minuti)
7. Verifica che il dominio risolva: `curl -I https://media.flowfitpro.it`

## Verifica

Dopo aver aggiornato l'URL:

1. Riavvia il server di sviluppo:
   ```bash
   pnpm dev
   ```

2. Carica una nuova foto in "Anamnesi" o "Check"

3. Verifica che l'URL generato sia corretto e che l'immagine si carichi

4. Controlla la console del browser - non dovrebbero esserci errori ERR_NAME_NOT_RESOLVED

## Note

- Se usi il custom domain, assicurati che il dominio sia registrato e configurato correttamente in Cloudflare DNS
- L'URL pubblico standard (`pub-<hash>.r2.dev`) funziona immediatamente senza configurazione aggiuntiva
- Dopo aver cambiato l'URL, le vecchie foto caricate con l'URL precedente non funzioneranno più (dovrai ricaricarle)
