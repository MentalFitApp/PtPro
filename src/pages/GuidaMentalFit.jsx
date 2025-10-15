import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import coverImage from '../assets/cover-mentalfit.jpg'; // Assicurati che l'immagine sia in src/assets/

// IL TUO EDITOR PERSONALE È QUI
// Questa è la versione ultra-completa della guida, basata sul documento originale.
const ebookPages = [
    // Sezione 1: Introduzione
    { id: 1, type: 'cover', imageUrl: coverImage },
    { id: 2, type: 'page', title: 'Introduzione', content: (<div><blockquote className="text-xl italic border-l-4 border-rose-500 pl-4 my-6 text-left">"Se stai leggendo, vuoi un cambiamento reale: più energia, un corpo migliore e una mentalità vincente."</blockquote><p className="text-slate-300 text-left">Il metodo <strong>MentalFit</strong> nasce da una visione potente: <strong>ogni corpo è diverso e ha bisogno di un percorso su misura</strong>. Questa guida ti darà gli strumenti pratici per ottenere risultati reali e duraturi.</p></div>), theme: 'dark' },
    { id: 3, type: 'page', title: 'I 3 Pilastri del Successo', content: (<div className="flex justify-around items-start w-full gap-4 mt-8"> <div className="text-center w-1/3 p-2 rounded-lg"> <span className="text-5xl">🏋️‍♂️</span> <h3 className="font-bold mt-2 text-base">Allenamento Progressivo</h3> <p className="text-xs text-slate-400 mt-1">Migliorare poco alla volta, settimana dopo settimana.</p> </div> <div className="text-center w-1/3 p-2 rounded-lg"> <span className="text-5xl">🍎</span> <h3 className="font-bold mt-2 text-base">Nutrizione Personalizzata</h3> <p className="text-xs text-slate-400 mt-1">Mangiare in modo sostenibile senza sentirti in gabbia.</p> </div> <div className="text-center w-1/3 p-2 rounded-lg"> <span className="text-5xl">🧠</span> <h3 className="font-bold mt-2 text-base">Mindset & Lifestyle</h3> <p className="text-xs text-slate-400 mt-1">Sonno, stress e disciplina quotidiana.</p> </div> </div>), theme: 'dark' },
    { id: 4, type: 'page', title: 'Glossario Rapido', content: (<ul className="text-left space-y-3 w-full text-sm"> <li className="p-2 bg-slate-100 rounded-md"><strong>TDEE:</strong> Il tuo fabbisogno calorico giornaliero.</li> <li className="p-2 bg-slate-100 rounded-md"><strong>Deficit Calorico:</strong> Mangiare meno per dimagrire.</li> <li className="p-2 bg-slate-100 rounded-md"><strong>Surplus Calorico:</strong> Mangiare di più per la massa.</li> <li className="p-2 bg-slate-100 rounded-md"><strong>Ipertrofia:</strong> L'aumento della massa muscolare.</li> <li className="p-2 bg-slate-100 rounded-md"><strong>NEAT:</strong> Calorie bruciate con movimento non sportivo.</li></ul>), theme: 'light' },
    
    // Sezione 2: Le Fondamenta
    { id: 5, type: 'page', title: 'Riconosci il Tuo Fisico', content: (<div className="text-left text-sm text-slate-300"><p>Uno dei motivi per cui tanti non vedono risultati è che seguono diete generiche. La verità è che non tutti i corpi rispondono allo stesso modo. Il primo passo è capire la tua base di partenza, il tuo <strong>biotipo</strong>.</p></div>), theme: 'dark' },
    { id: 6, type: 'page', title: 'I Biotipi Maschili', content: (<div className="flex flex-col sm:flex-row justify-around w-full gap-4 mt-6 text-center"> <div className="p-3 rounded-lg bg-slate-100 flex-1"><h3 className="font-bold">🏃‍♂️ Ectomorfo</h3><p className="text-sm mt-1">Magro, metabolismo veloce, fatica a mettere massa.</p></div> <div className="p-3 rounded-lg bg-slate-100 flex-1"><h3 className="font-bold">💪 Mesomorfo</h3><p className="text-sm mt-1">Fisico atletico, guadagni muscolari rapidi.</p></div> <div className="p-3 rounded-lg bg-slate-100 flex-1"><h3 className="font-bold">🐻 Endomorfo</h3><p className="text-sm mt-1">Struttura robusta, tende ad accumulare grasso.</p></div></div>), theme: 'light' },
    { id: 7, type: 'page', title: 'I Biotipi Femminili', content: (<div className="flex flex-col sm:flex-row justify-around w-full gap-4 mt-6 text-center"> <div className="p-3 rounded-lg bg-slate-100 flex-1"><h3 className="font-bold">🍐 Pera (Ginoide)</h3><p className="text-sm mt-1">Accumulo su cosce e glutei.</p></div> <div className="p-3 rounded-lg bg-slate-100 flex-1"><h3 className="font-bold">🍏 Mela (Androide)</h3><p className="text-sm mt-1">Accumulo su addome e fianchi.</p></div> <div className="p-3 rounded-lg bg-slate-100 flex-1"><h3 className="font-bold">📊 Rettangolare</h3><p className="text-sm mt-1">Fisico uniforme, poche curve.</p></div></div>), theme: 'light' },
    { id: 8, type: 'page', title: 'Test Pratico', content: (<div className="text-left text-sm w-full"><p className="mb-4">Rispondi velocemente a queste domande per avere un'idea del tuo biotipo dominante.</p><ul className="list-decimal list-inside space-y-2"><li><strong>Struttura ossea:</strong> Sottile (Ecto/Rett.), media (Meso/Pera) o spessa (Endo/Mela)?</li><li><strong>Risposta agli allenamenti:</strong> Fai fatica a crescere (Ecto/Rett.), cresci facilmente (Meso/Pera) o metti muscoli ma anche grasso (Endo/Mela)?</li><li><strong>Metabolismo:</strong> Mangi molto senza ingrassare (Ecto) o ingrassi facilmente (Endo/Mela/Pera)?</li></ul></div>), theme: 'light' },

    // Sezione 3: Piani Uomo Dettagliati
    { id: 9, type: 'page', title: 'Uomo – Ectomorfo', content: (<div className="text-left w-full text-sm space-y-3"> <p><strong>👤 Caratteristiche:</strong> Magro di costituzione, ossatura fine, metabolismo veloce, fatica a mettere massa muscolare.</p> <p><strong>🎯 Obiettivi:</strong> Costruire massa muscolare con un surplus calorico ben gestito e aumentare la forza.</p> <p><strong>❌ Errori Comuni:</strong> Fare troppo cardio, allenarsi tutti i giorni, allenamenti troppo lunghi, mangiare tanto ma in modo disordinato.</p></div>), theme: 'light' },
    { id: 10, type: 'page', title: 'Ectomorfo: Allenamento (1/2)', content: (<div className="text-left w-full text-sm"><h4 className="font-bold text-base text-rose-500 mb-2">Giorno 1: Petto & Tricipiti</h4><table className="w-full text-left border-collapse text-xs"><thead><tr className="bg-slate-200"><th className="p-1">Esercizio</th><th className="p-1">Serie/Reps</th></tr></thead><tbody><tr><td>Chest Press</td><td>3x6-8</td></tr><tr><td>Panca Piana Manubri</td><td>3x8-10</td></tr><tr><td>Croci ai Cavi</td><td>3x12-15</td></tr><tr><td>Dips Parallele</td><td>3xmax</td></tr><tr><td>Pushdown Cavi</td><td>3x12-15</td></tr></tbody></table><h4 className="font-bold text-base text-rose-500 mt-4 mb-2">Giorno 2: Schiena & Bicipiti</h4><table className="w-full text-left border-collapse text-xs"><thead><tr className="bg-slate-200"><th className="p-1">Esercizio</th><th className="p-1">Serie/Reps</th></tr></thead><tbody><tr><td>Stacco da Terra</td><td>1x10 + 3x8-10</td></tr><tr><td>Rematore Bilanciere</td><td>3x8-10</td></tr><tr><td>Lat Machine</td><td>3x10</td></tr><tr><td>Curl Bilanciere</td><td>3x8-10</td></tr><tr><td>Hammer Curl</td><td>3x12</td></tr></tbody></table></div>), theme: 'light' },
    { id: 11, type: 'page', title: 'Ectomorfo: Allenamento (2/2)', content: (<div className="text-left w-full text-sm"><h4 className="font-bold text-base text-rose-500 mb-2">Giorno 3: Gambe</h4><table className="w-full text-left border-collapse text-xs"><thead><tr className="bg-slate-200"><th className="p-1">Esercizio</th><th className="p-1">Serie/Reps</th></tr></thead><tbody><tr><td>Squat</td><td>4x6-8</td></tr><tr><td>Affondi Camminati</td><td>3x10 (per gamba)</td></tr><tr><td>Leg Press</td><td>3x12</td></tr><tr><td>Leg Curl Sdraiato</td><td>3x12</td></tr><tr><td>Calf Raises</td><td>4x15</td></tr></tbody></table><h4 className="font-bold text-base text-rose-500 mt-4 mb-2">Giorno 4: Spalle & Full Body</h4><table className="w-full text-left border-collapse text-xs"><thead><tr className="bg-slate-200"><th className="p-1">Esercizio</th><th className="p-1">Serie/Reps</th></tr></thead><tbody><tr><td>Military Press</td><td>4x6-8</td></tr><tr><td>Alzate Laterali</td><td>3x12-15</td></tr><tr><td>Trazioni Sbarra</td><td>3xmax</td></tr><tr><td>Panca Piana</td><td>3x8 (richiamo)</td></tr><tr><td>Stacco Rumeno</td><td>3x8</td></tr></tbody></table></div>), theme: 'light' },
    { id: 12, type: 'page', title: 'Ectomorfo: Nutrizione', content: (<div className="text-left w-full text-sm space-y-3"><h4 className="font-bold text-base text-rose-500">Piano Alimentare (Esempio)</h4><ul className="list-none text-xs space-y-2"><li><strong>Colazione:</strong> 300ml latte, 80g avena, 30g burro d'arachidi, 1 banana, 30g whey.</li><li><strong>Spuntino:</strong> 2 fette pane integrale, 100g tacchino, 20g frutta secca.</li><li><strong>Pranzo:</strong> 150g riso, 200g pollo, verdure, 1 cucchiaio olio.</li><li><strong>Cena:</strong> 180g salmone, 250g patate dolci, insalata.</li></ul><p className="text-xs mt-2"><strong>💊 Integrazione:</strong> Creatina, Proteine, Omega-3, EAA.</p></div>), theme: 'light' },
    { id: 13, type: 'page', title: 'Uomo – Mesomorfo', content: (<div className="text-left w-full text-sm space-y-3"> <p><strong>👤 Caratteristiche:</strong> Struttura muscolare naturale, fisico atletico. Mette massa e perde grasso con facilità.</p> <p><strong>🎯 Obiettivi:</strong> Costruire forza e massa mantenendo bassa la % di grasso.</p> <p><strong>❌ Errori Comuni:</strong> Troppa sicurezza, trascurare progressione e tecnica, saltare il cardio.</p> <h4 className="font-bold text-base pt-2 text-rose-500">Allenamento: Push/Pull/Legs + Richiamo</h4></div>), theme: 'light' },
    { id: 14, type: 'page', title: 'Mesomorfo: Allenamento', content: (<div className="text-left w-full text-sm"><h4 className="font-bold text-base text-rose-500 mb-2">Giorno 1: Push</h4><table className="w-full text-left border-collapse text-xs"><thead><tr className="bg-slate-200"><th className="p-1">Esercizio</th><th className="p-1">Serie/Reps</th></tr></thead><tbody><tr><td>Panca Piana Manubri</td><td>5x5</td></tr><tr><td>Military Press</td><td>4x8</td></tr><tr><td>Dip Parallele</td><td>4x10</td></tr><tr><td>Alzate Laterali</td><td>4x12</td></tr></tbody></table><h4 className="font-bold text-base text-rose-500 mt-4 mb-2">Giorno 2: Pull</h4><table className="w-full text-left border-collapse text-xs"><thead><tr className="bg-slate-200"><th className="p-1">Esercizio</th><th className="p-1">Serie/Reps</th></tr></thead><tbody><tr><td>Stacchi</td><td>5x5</td></tr><tr><td>Rematore</td><td>4x8</td></tr><tr><td>Lat Machine</td><td>4x10</td></tr><tr><td>Curl Bilanciere</td><td>4x12</td></tr></tbody></table></div>), theme: 'light' },
    { id: 15, type: 'page', title: 'Mesomorfo: Nutrizione', content: (<div className="text-left w-full text-sm space-y-3"><h4 className="font-bold text-base text-rose-500">Piano Alimentare (Esempio)</h4><ul className="list-none text-xs space-y-2"><li><strong>Colazione:</strong> 200g albumi, 2 uova intere, 60g avena, 1 banana.</li><li><strong>Pranzo:</strong> 120g riso integrale, 180g pollo, verdure.</li><li><strong>Cena:</strong> 150g salmone, 200g patate, verdure.</li><li><strong>Post-cena:</strong> 250g fiocchi di latte.</li></ul><p className="text-xs mt-2"><strong>💊 Integrazione:</strong> Whey Isolate, Ciclodestrine, Creatina, Omega-3, Magnesio.</p></div>), theme: 'light' },
    { id: 16, type: 'page', title: 'Uomo – Endomorfo', content: (<div className="text-left w-full text-sm space-y-3"> <p><strong>👤 Caratteristiche:</strong> Struttura robusta, ossatura larga, tende ad accumulare grasso.</p> <p><strong>🎯 Obiettivi:</strong> Aumentare massa magra per accelerare il metabolismo, dimagrire gradualmente.</p> <p><strong>❌ Errori Comuni:</strong> Diete estreme, solo cardio infinito, mancanza di costanza.</p> <h4 className="font-bold text-base pt-2 text-rose-500">Allenamento: Full Body + Cardio Mirato</h4></div>), theme: 'light' },
    { id: 17, type: 'page', title: 'Endomorfo: Allenamento', content: (<div className="text-left w-full text-sm"><h4 className="font-bold text-base text-rose-500 mb-2">Split Suggerita</h4><ul className="list-disc list-inside text-xs"><li><strong>Giorno 1:</strong> Full Body (Squat 4x8, Panca 4x8, Rematore 4x10).</li><li><strong>Giorno 2:</strong> Cardio HIIT 20'.</li><li><strong>Giorno 3:</strong> Full Body (Stacchi 4x6, Military Press 4x8, Trazioni 4x8).</li><li><strong>Giorno 4:</strong> Circuito brucia grassi.</li><li><strong>Giorno 5 (opzionale):</strong> Cardio LISS 30-40'.</li></ul></div>), theme: 'light' },
    { id: 18, type: 'page', title: 'Endomorfo: Nutrizione', content: (<div className="text-left w-full text-sm space-y-3"><h4 className="font-bold text-base text-rose-500">Piano Alimentare (Esempio)</h4><ul className="list-none text-xs space-y-2"><li><strong>Colazione:</strong> 3 uova, 100g avena, 1 mela.</li><li><strong>Pranzo:</strong> 100g quinoa, 150g tacchino, verdure.</li><li><strong>Spuntino:</strong> Shake proteico + mandorle.</li><li><strong>Cena:</strong> 200g merluzzo, 150g patate dolci, verdure.</li></ul><p className="text-xs mt-2"><strong>💊 Integrazione:</strong> Whey Isolate, Omega-3, Acido Alfa Lipoico, Tè Verde.</p></div>), theme: 'light' },

    // Sezione 4: Piani Donna Dettagliati
    { id: 19, type: 'page', title: 'Donna – Corpo a Pera', content: (<div className="text-left w-full text-sm space-y-3"> <p><strong>🍐 Caratteristiche:</strong> Fianchi larghi, spalle strette. Accumulo su glutei e cosce.</p> <p><strong>🎯 Obiettivi:</strong> Tonificare la parte alta (spalle, dorso) per creare equilibrio estetico.</p> <p><strong>❌ Errori Comuni:</strong> Allenare solo le gambe, diete drastiche, cardio eccessivo.</p></div>), theme: 'light' },
    { id: 20, type: 'page', title: 'Pera: Allenamento', content: (<div className="text-left w-full text-sm"><h4 className="font-bold text-base text-rose-500 mb-2">Split Suggerita</h4><ul className="list-disc list-inside text-xs"><li><strong>Giorno 1 (Upper):</strong> Alzate Laterali 3x15, Lento Manubri 3x8-10, Lat Machine 4x8-10.</li><li><strong>Giorno 2 (Lower):</strong> Hip Thrust 4x12, Squat 3x10, Leg Curl 4x10, Affondi 3x12.</li><li><strong>Giorno 3 (Core + Cardio):</strong> Plank, Crunch, 20' camminata veloce.</li><li><strong>Giorno 4 (Total Body):</strong> Circuito con manubri.</li></ul></div>), theme: 'light' },
    { id: 21, type: 'page', title: 'Pera: Nutrizione', content: (<div className="text-left w-full text-sm space-y-3"><h4 className="font-bold text-base text-rose-500">Piano Alimentare (Esempio)</h4><ul className="list-none text-xs space-y-2"><li><strong>Colazione:</strong> 40g avena, 200ml latte, 1 cucchiaio burro d'arachidi.</li><li><strong>Pranzo:</strong> 120g riso, 150g pollo, verdure al vapore.</li><li><strong>Cena:</strong> 150g salmone, 200g patate dolci, verdure grigliate.</li></ul><p className="text-xs mt-2"><strong>💊 Integrazione:</strong> Drenante, Cromo picolinato, Termogenico, Omega-3.</p></div>), theme: 'light' },
    { id: 22, type: 'page', title: 'Donna – Corpo a Mela', content: (<div className="text-left w-full text-sm space-y-3"> <p><strong>🍏 Caratteristiche:</strong> Spalle larghe, gambe snelle. Grasso accumulato su addome.</p> <p><strong>🎯 Obiettivi:</strong> Diminuire il grasso addominale, rafforzare gambe e glutei per armonia.</p> <p><strong>❌ Errori Comuni:</strong> Allenarsi solo con addominali, saltare i carboidrati.</p></div>), theme: 'light' },
    { id: 23, type: 'page', title: 'Mela: Allenamento', content: (<div className="text-left w-full text-sm"><h4 className="font-bold text-base text-rose-500 mb-2">Split Suggerita</h4><ul className="list-disc list-inside text-xs"><li><strong>Giorno 1 (Gambe/Glutei):</strong> Pressa Monopodale 3x8-10, Hip Thrust 3x10, Abductor 3x1'.</li><li><strong>Giorno 2 (Upper):</strong> Panca Piana 3x10, Rematore 3x10, Alzate Laterali 3x12.</li><li><strong>Giorno 3 (Core + HIIT):</strong> Side Plank, Russian Twist, 20' HIIT.</li><li><strong>Giorno 4 (Full Body):</strong> Deadlift 4x8, Military Press 3x10, Push up 3xmax.</li></ul></div>), theme: 'light' },
    { id: 24, type: 'page', title: 'Mela: Nutrizione', content: (<div className="text-left w-full text-sm space-y-3"><h4 className="font-bold text-base text-rose-500">Piano Alimentare (Esempio)</h4><ul className="list-none text-xs space-y-2"><li><strong>Colazione:</strong> 200ml latte veg, 40g avena, 10g cacao amaro.</li><li><strong>Pranzo:</strong> 100g pasta integrale, 120g tacchino, verdure.</li><li><strong>Cena:</strong> 150g orata al forno, 200g patate, insalata.</li></ul><p className="text-xs mt-2"><strong>💊 Integrazione:</strong> Magnesio, Omega-3, Cromo Picolinato, Berberina.</p></div>), theme: 'light' },
    { id: 25, type: 'page', title: 'Donna – Corpo Rettangolare', content: (<div className="text-left w-full text-sm space-y-3"> <p><strong>📊 Caratteristiche:</strong> Poche curve naturali, fisico "dritto".</p> <p><strong>🎯 Obiettivi:</strong> Creare curve visive (spalle e glutei), definire il punto vita.</p> <p><strong>❌ Errori Comuni:</strong> Fare solo cardio, usare sempre gli stessi pesi.</p></div>), theme: 'light' },
    { id: 26, type: 'page', title: 'Rettangolare: Allenamento', content: (<div className="text-left w-full text-sm"><h4 className="font-bold text-base text-rose-500 mb-2">Split Suggerita</h4><ul className="list-disc list-inside text-xs"><li><strong>Giorno 1 (Spalle/Glutei):</strong> Shoulder Press 3x10, Alzate Lat. 3x12, Hip Thrust 4x12.</li><li><strong>Giorno 2 (Dorso/Core):</strong> Trazioni Assistite 3x10, Rematore 3x8-10, Crunch Inverso 3x15.</li><li><strong>Giorno 3 (Gambe):</strong> Stacco Rumeno 3x8-10, Affondi 3x12, Leg Press 3x10.</li><li><strong>Giorno 4 (Total Body + HIIT):</strong> Circuito + 20' HIIT.</li></ul></div>), theme: 'light' },
    { id: 27, type: 'page', title: 'Rettangolare: Nutrizione', content: (<div className="text-left w-full text-sm space-y-3"><h4 className="font-bold text-base text-rose-500">Piano Alimentare (Esempio)</h4><ul className="list-none text-xs space-y-2"><li><strong>Colazione:</strong> 2 uova intere + 2 albumi, 40g pane integrale.</li><li><strong>Pranzo:</strong> 100g riso basmati, 120g pollo, zucchine.</li><li><strong>Cena:</strong> 150g merluzzo, 200g patate dolci, insalata.</li></ul><p className="text-xs mt-2"><strong>💊 Integrazione:</strong> Creatina, Whey Protein, Omega-3, Vitamina D.</p></div>), theme: 'light' },

    // Sezione 5: Mindset e Lifestyle
    { id: 28, type: 'page', title: '🧠 Il Mindset MentalFit', content: (<div><blockquote className="text-xl italic border-l-4 border-rose-500 pl-4 my-6">"Il corpo cambia solo se la mente cambia prima."</blockquote><ul className="list-disc list-inside text-left text-slate-300"><li><strong>Disciplina:</strong> Piccoli gesti ripetuti ogni giorno.</li><li><strong>Pazienza:</strong> I risultati veri arrivano in mesi, non settimane.</li><li><strong>Resilienza:</strong> Impara a gestire gli sgarri e le cadute. Non fermarti mai.</li></ul></div>), theme: 'dark' },
    { id: 29, type: 'page', title: 'Le Trappole da Evitare', content: (<div className="text-left w-full text-sm text-slate-300"><ul className="space-y-3"><li><strong>Saltare i pasti:</strong> Rallenta il metabolismo e aumenta la fame nervosa.</li><li><strong>Pesarsi ogni giorno:</strong> Il peso oscilla per liquidi e glicogeno. Non riflette i reali cambiamenti.</li><li><strong>Cercare la perfezione:</strong> Meglio un 80% costante che un 100% per 10 giorni per poi mollare.</li></ul></div>), theme: 'dark' },
    { id: 30, type: 'page', title: '📊 Monitoraggio dei Progressi', content: (<div><p className="text-slate-300">Avere prove reali che stai migliorando è la motivazione più grande.</p><ul className="list-disc list-inside mt-4 text-left text-slate-300"><li><strong>FOTO:</strong> 1 volta a settimana, stessa luce. Sono più importanti della bilancia.</li><li><strong>PESO:</strong> 1 volta a settimana, al mattino a digiuno.</li><li><strong>MISURE:</strong> Vita, fianchi, torace. 1 volta al mese.</li><li><strong>PERFORMANCE:</strong> Tieni traccia dei carichi e delle ripetizioni.</li></ul></div>), theme: 'dark' },

    // Sezione 6: Appendici
    { id: 31, type: 'page', title: '🛒 Appendice A – Lista Spesa', content: (<div><div className="grid grid-cols-3 gap-4 text-left"><div><h4 className="font-bold">Proteine</h4><ul className="text-sm"><li>Pollo</li><li>Tacchino</li><li>Uova</li><li>Salmone</li></ul></div><div><h4 className="font-bold">Carboidrati</h4><ul className="text-sm"><li>Riso Basmati</li><li>Patate</li><li>Avena</li><li>Quinoa</li></ul></div><div><h4 className="font-bold">Grassi Sani</h4><ul className="text-sm"><li>Avocado</li><li>Olio d'Oliva</li><li>Frutta Secca</li><li>Semi di Chia</li></ul></div></div></div>), theme: 'light' },
    { id: 32, type: 'page', title: '🍳 Appendice B – Ricette Rapide', content: (<div className="text-left space-y-4 text-sm"><div><h4 className="font-bold">Colazione – Overnight Oats:</h4><p>40g avena + 200ml latte + 1 cucchiaio semi di chia + ½ banana. Lascia in frigo la sera.</p></div><div><h4 className="font-bold">Pranzo – Bowl Proteica:</h4><p>120g pollo + 100g riso basmati + verdure miste + 1 cucchiaio d'olio.</p></div><div><h4 className="font-bold">Cena – Salmone e Patate Dolci:</h4><p>150g salmone + 200g patate dolci al forno + insalata.</p></div></div>), theme: 'light' },
    { id: 33, type: 'page', title: '✅ Appendice C – Checklist Settimanale', content: (<div><ul className="list-none text-left space-y-2"><li><label className="flex items-center"><input type="checkbox" className="mr-2 h-4 w-4 accent-rose-500"/>Ho fatto almeno 3 allenamenti.</label></li><li><label className="flex items-center"><input type="checkbox" className="mr-2 h-4 w-4 accent-rose-500"/>Ho aumentato un carico o una ripetizione.</label></li><li><label className="flex items-center"><input type="checkbox" className="mr-2 h-4 w-4 accent-rose-500"/>Ho bevuto almeno 2 litri d’acqua al giorno.</label></li><li><label className="flex items-center"><input type="checkbox" className="mr-2 h-4 w-4 accent-rose-500"/>Ho dormito almeno 7 ore per notte.</label></li></ul></div>), theme: 'light' },
    
    // Sezione 7: Conclusione
    { id: 34, type: 'page', title: 'Conclusione – Ora Tocca a Te', content: (<div><p className="mb-6">Sei arrivato fino a qui. Dentro di te c'è già la forza per cambiare. Questa guida non è una formula magica: <strong>è una bussola</strong>. Ma non basta leggere: <strong>serve agire</strong>.</p><blockquote className="text-xl italic border-l-4 border-rose-500 pl-4">"La costanza batte la motivazione, ma il giusto metodo batte entrambe."</blockquote></div>), theme: 'dark' },
    { id: 35, type: 'page', title: 'Vuoi un Piano Davvero su Misura?', content: (<div><p className="mb-6">Se vuoi un percorso personalizzato al 100% per il tuo fisico, con il supporto diretto del mio team, contattaci.</p><div className="mt-8"><a href="https://www.instagram.com/maurizio_biondo_/" target="_blank" rel="noopener noreferrer" className="bg-gradient-to-r from-pink-500 to-orange-400 text-white font-bold py-3 px-6 rounded-lg text-lg animate-pulse">Scrivimi "MENTALFIT" su Instagram</a></div></div>), theme: 'dark' },
];


const PageContainer = ({ pageData, isVisible, isRenderingPdf }) => {
    const themeClasses = pageData.theme === 'dark' ? 'bg-zinc-900 text-slate-200' : 'bg-slate-50 text-slate-800';
    const visibilityClass = isVisible ? 'opacity-100' : 'opacity-0 absolute';
    const renderClass = isRenderingPdf ? '' : 'transition-opacity duration-500';

    if (pageData.type === 'cover') {
        return (
            <div className={`w-full h-full ${renderClass} ${visibilityClass} ${isRenderingPdf ? '' : 'absolute inset-0'}`}>
                <img src={pageData.imageUrl} alt="Copertina Guida MentalFit" className="w-full h-full object-cover" />
            </div>
        );
    }
    return (
        <div className={`w-full h-full p-6 flex flex-col items-center justify-center text-center ${themeClasses} ${renderClass} ${visibilityClass} ${isRenderingPdf ? '' : 'absolute inset-0'}`}>
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-rose-500">{pageData.title}</h2>
            <div className="text-base sm:text-lg w-full max-w-2xl">{pageData.content}</div>
        </div>
    );
};


const GuidaMentalFit = () => {
    const [currentPage, setCurrentPage] = useState(0);
    const [leadCaptured, setLeadCaptured] = useState(false);
    const [nome, setNome] = useState('');
    const [telefono, setTelefono] = useState('');
    const [instagram, setInstagram] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRenderingPdf, setIsRenderingPdf] = useState(false);
    
    const totalPages = ebookPages.length;

    const handleLeadSubmit = (e) => {
        e.preventDefault();
        if (!nome || !telefono) {
            alert('Per favore, compila almeno nome e telefono.');
            return;
        }
        setIsSubmitting(true);

        const scriptURL = 'https://script.google.com/macros/s/AKfycbyIf3C1bx7ZEzRiLiHayRzmcf_BLaH3Apd4ePlKBz_pEEErGF-QPhjH67lvyGH_O_ViFw/exec';

        const formData = new FormData();
        formData.append('timestamp', new Date().toLocaleString('it-IT'));
        formData.append('nome', nome);
        formData.append('telefono', telefono);
        formData.append('instagram', instagram);

        fetch(scriptURL, { method: 'POST', body: formData })
            .then(response => response.json())
            .then(data => {
                if (data.result === 'success') {
                    setLeadCaptured(true);
                } else {
                    console.error("Errore restituito da Google Script: ", data.error);
                    alert('Si è verificato un errore. Assicurati che lo script sia configurato correttamente e riprova.');
                }
            })
            .catch(error => {
                console.error("Errore nell'invio del modulo: ", error);
                alert('Si è verificato un errore di connessione. Riprova.');
            })
            .finally(() => {
                setIsSubmitting(false);
            });
    };

    const handleDownloadPDF = async () => {
        setIsRenderingPdf(true);
        const pdf = new jsPDF('p', 'px', [320, 568]);
        const pdfWidth = 320;
        const pdfHeight = 568;

        for (let i = 0; i < totalPages; i++) {
            const pageElement = document.getElementById(`pdf-page-${i}`);
            if (pageElement) {
                const canvas = await html2canvas(pageElement, {
                    width: pdfWidth,
                    height: pdfHeight,
                    scale: 2,
                    useCORS: true,
                });
                const imgData = canvas.toDataURL('image/png');
                if (i > 0) {
                    pdf.addPage();
                }
                pdf.setPage(i + 1);
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            }
        }
        pdf.save("Guida-Completa-MentalFit.pdf");
        setIsRenderingPdf(false);
    };

    const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1));
    const goToPrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 0));

    if (!leadCaptured) {
        return (
            <div className="flex items-center justify-center p-4 min-h-screen">
                <div className="bg-zinc-950/80 backdrop-blur-lg p-8 rounded-lg shadow-lg max-w-sm w-full text-center border border-white/10 text-slate-200">
                    <h2 className="text-2xl font-bold mb-4 text-white">Accedi alla Guida Gratuita</h2>
                    <p className="mb-6 text-slate-400">Lascia i tuoi dati per sbloccare la Guida Completa MentalFit.</p>
                    <form onSubmit={handleLeadSubmit}>
                        <input type="text" placeholder="Il tuo nome *" value={nome} onChange={(e) => setNome(e.target.value)} className="w-full p-3 mb-4 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:ring-rose-500 focus:border-rose-500" required />
                        <input type="tel" placeholder="Numero di telefono *" value={telefono} onChange={(e) => setTelefono(e.target.value)} className="w-full p-3 mb-4 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:ring-rose-500 focus:border-rose-500" required />
                        <input type="text" placeholder="Nome su Instagram (opzionale)" value={instagram} onChange={(e) => setInstagram(e.target.value)} className="w-full p-3 mb-4 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:ring-rose-500 focus:border-rose-500" />
                        <button type="submit" disabled={isSubmitting} className="w-full bg-rose-600 text-white p-3 rounded-lg font-bold hover:bg-rose-700 transition-colors disabled:bg-zinc-600">
                            {isSubmitting ? 'Invio in corso...' : 'VISUALIZZA ORA'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center w-full py-8">
            {isRenderingPdf && (
                <div className="fixed inset-0 bg-black/50 flex flex-col items-center justify-center z-50">
                    <p className="text-white mb-2">Generazione PDF in corso...</p>
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                </div>
            )}
            <div id="ebook-viewer" className="relative w-full max-w-md aspect-[9/16] bg-zinc-800 rounded-lg overflow-hidden shadow-2xl border-4 border-zinc-700">
                {ebookPages.map((page, index) => (
                    <PageContainer key={page.id} pageData={page} isVisible={index === currentPage} isRenderingPdf={false} />
                ))}
            </div>

            {/* Hidden elements for PDF rendering */}
            <div style={{ position: 'absolute', left: '-9999px', top: '0' }}>
                 {ebookPages.map((page, index) => (
                    <div key={`pdf-${page.id}`} id={`pdf-page-${index}`} style={{ width: '320px', height: '568px' }}>
                         <PageContainer pageData={page} isVisible={true} isRenderingPdf={true} />
                    </div>
                 ))}
            </div>

            <div className="flex justify-between items-center w-full max-w-md mt-4">
                <button onClick={goToPrevPage} disabled={currentPage === 0} className="bg-zinc-700 text-white py-2 px-4 rounded-lg disabled:opacity-50">Indietro</button>
                <span className="text-slate-300">{currentPage + 1} / {totalPages}</span>
                <button onClick={goToNextPage} disabled={currentPage === totalPages - 1} className="bg-zinc-700 text-white py-2 px-4 rounded-lg disabled:opacity-50">Avanti</button>
            </div>
            <button onClick={handleDownloadPDF} disabled={isRenderingPdf} className="mt-4 bg-rose-600 text-white py-2 px-6 rounded-lg font-bold hover:bg-rose-700 transition-colors disabled:bg-zinc-600">
                {isRenderingPdf ? 'Creando...' : 'Scarica PDF'}
            </button>
        </div>
    );
};

export default GuidaMentalFit;

