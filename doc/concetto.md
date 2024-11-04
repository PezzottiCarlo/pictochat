# Tesi: Pictochat

## Informazioni di Base
- **Nome dell’app**: Pictochat
- **Studente**: Carlo Pezzotti

## Introduzione
L’obiettivo di questa tesi è evolvere un'applicazione di chat sviluppata durante il progetto di semestre, Pictochat, rendendola un’applicazione esclusivamente **frontend** con funzionalità avanzate per la comunicazione rapida tramite pittogrammi. Lo scopo finale è rendere Pictochat uno strumento efficace e user-friendly per rispondere rapidamente a domande generiche attraverso suggerimenti di pittogrammi, supportati da un sistema di **Intelligenza Artificiale (AI)**.

Il progetto si concentrerà su modifiche strutturali, miglioramenti dell’interfaccia e usabilità, e soprattutto sull’integrazione di un sistema di AI capace di suggerire pittogrammi pertinenti in risposta a frasi comuni come "Come stai?", "Cosa vuoi per cena?", e simili.

<div class="page"/>
---

## Obiettivi della Tesi

### 1. Rimozione del Backend
- **Descrizione**: Eliminare completamente la parte di backend presente nel progetto originale, trasformando l’applicazione in una soluzione **completamente frontend**.
- **Motivazione**: La scelta di un’app senza backend riduce la complessità e i costi di manutenzione, migliorando anche la rapidità e la semplicità d’uso per l’utente. Un'app frontend è inoltre più facilmente distribuita e aggiornata.
- **Risultato Atteso**: Un'applicazione completamente autonoma, che funzioni solo lato client, con dati gestiti in locale.

### 2. Miglioramento della Gestione dei Messaggi
- **Descrizione**: Ottimizzare l’interfaccia e il flusso di gestione dei messaggi, assicurando che la presentazione e la sequenza dei messaggi risultino chiari e intuitivi.
- **Motivazione**: Una gestione dei messaggi ottimizzata migliora l’esperienza utente, riducendo ambiguità e rendendo più facile e rapido rispondere o visualizzare le risposte.
- **Risultato Atteso**: Interfaccia dei messaggi chiara e reattiva, con una sequenza e visualizzazione coerente anche in conversazioni più complesse.

### 3. Gestione delle Immagini Profilo
- **Descrizione**: Integrare la possibilità di caricare e visualizzare immagini profilo, permettendo all’utente di personalizzare il proprio profilo e migliorare la riconoscibilità nelle conversazioni.
- **Motivazione**: La presenza delle immagini profilo rende l’esperienza di utilizzo più personale e permette un’identificazione visiva immediata.
- **Risultato Atteso**: Una sezione per caricare e modificare l’immagine del profilo, con immagini che vengono visualizzate accanto a ciascun messaggio.

### 4. Implementazione di AI per Suggerimenti di Pittogrammi
- **Descrizione**: Sviluppare e integrare un sistema di **Intelligenza Artificiale** capace di analizzare le domande o i prompt dell’utente e suggerire una serie di pittogrammi adeguati come risposta.
    - **Esempi di prompt**: "Come stai?", "Cosa vuoi per cena?", "Cosa hai fatto ieri?".
    - **Funzionalità**: L’AI dovrebbe essere in grado di elaborare input generici e proporre una selezione di pittogrammi contestuali che possano rappresentare risposte rapide e intuitive.
- **Motivazione**: L’introduzione di suggerimenti basati su AI permette all’utente di rispondere rapidamente senza digitare o cercare manualmente i pittogrammi, rendendo Pictochat un’applicazione più intuitiva e accessibile.
- **Risultato Atteso**: Un sistema AI integrato, in grado di suggerire pittogrammi pertinenti a domande o frasi comuni, con una precisione e una varietà che permettano all'utente di rispondere in modo naturale.

<div class="page"/>

### 5. Gestione delle Notifiche
- **Descrizione**: Implementare un sistema di notifiche che avvisi l’utente in tempo reale su nuovi messaggi o aggiornamenti rilevanti.
- **Motivazione**: Le notifiche migliorano l’interattività dell’app, assicurando che l’utente sia sempre aggiornato senza dover controllare l’app costantemente.
- **Risultato Atteso**: Sistema di notifiche integrato e configurabile, con possibilità di ricevere avvisi sonori e visivi per ogni nuovo messaggio.

### 6. Feedback Auditivo
- **Descrizione**: Aggiungere effetti sonori per accompagnare specifiche azioni all'interno dell'app, come la ricezione di un messaggio, l'invio di una risposta, o la ricezione di una notifica.
- **Motivazione**: Il feedback auditivo contribuisce a migliorare l’interazione utente, garantendo risposte sensoriali che migliorano l’esperienza e aiutano a non perdere notifiche importanti.
- **Risultato Atteso**: Suoni piacevoli e non invasivi che accompagnano l’uso dell’applicazione, integrati in modo da non risultare fastidiosi per l’utente.

### 7. Personalizzazione dei Pittogrammi Personali
- **Descrizione**: Consentire all'utente di caricare, modificare e personalizzare i propri pittogrammi, in modo che possano rappresentare al meglio preferenze e risposte frequenti.
- **Motivazione**: La personalizzazione dei pittogrammi permette all’utente di avere un set di simboli e immagini rappresentativi delle proprie necessità e del proprio stile comunicativo.
- **Risultato Atteso**: Funzionalità per la creazione e gestione di pittogrammi personalizzati, accessibili dall’utente e integrabili nel flusso di messaggistica.

<div class="page"/>

## Focus della Tesi: Realizzazione dell’Intelligenza Artificiale
Il focus principale del lavoro sarà lo sviluppo del modulo di AI per i **suggerimenti di pittogrammi**, che rappresenta il vero valore aggiunto di Pictochat. L’AI dovrà essere in grado di analizzare il testo inserito, identificare le parole chiave e generare una selezione di pittogrammi appropriati. Verranno esplorate tecniche di elaborazione del linguaggio naturale (NLP) e tecnologie di machine learning per realizzare un sistema che permetta risposte rapide e intuitive, ottimizzando la user experience.

---

## Struttura e Metodo
La realizzazione della tesi sarà divisa in diverse fasi di lavoro:
1. **Studio delle tecnologie di frontend** e trasformazione dell'app in una versione solo client.
2. **Sviluppo della gestione dei messaggi** e altre funzionalità dell'interfaccia, inclusa la gestione delle immagini profilo e notifiche.
3. **Integrazione dell’AI** con test di suggerimento e ottimizzazione dei pittogrammi suggeriti.
4. **Test e Validazione**: Assicurare che tutte le funzionalità dell'app siano fluide, rapide e prive di errori, con un focus particolare sulla precisione dell’AI.
5. **Documentazione e Conclusioni**: Documentare i risultati ottenuti e analizzare i potenziali miglioramenti futuri.

## Conclusione
Il completamento di Pictochat rappresenta un progetto ambizioso e innovativo, che combina frontend avanzato e AI per migliorare la comunicazione con pittogrammi. La sua realizzazione offrirà un'applicazione intuitiva e veloce, con un'interfaccia semplice e funzionalità intelligenti che permetteranno agli utenti di rispondere facilmente e rapidamente a domande comuni.