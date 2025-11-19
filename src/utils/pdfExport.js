import jsPDF from 'jspdf';

/**
 * Export workout card to PDF
 */
export const exportWorkoutCardToPDF = (schedaData, clientName) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 20;
  const lineHeight = 7;
  const marginLeft = 15;
  const marginRight = 15;
  const maxWidth = pageWidth - marginLeft - marginRight;

  // Helper to check if we need a new page
  const checkPageBreak = (neededSpace = 20) => {
    if (yPos + neededSpace > pageHeight - 20) {
      doc.addPage();
      yPos = 20;
      return true;
    }
    return false;
  };

  // Title
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text('Piano Allenamento', marginLeft, yPos);
  yPos += lineHeight * 2;

  // Client info
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.text(`Cliente: ${clientName}`, marginLeft, yPos);
  yPos += lineHeight;

  if (schedaData.obiettivo) {
    doc.text(`Obiettivo: ${schedaData.obiettivo}`, marginLeft, yPos);
    yPos += lineHeight;
  }

  if (schedaData.livello) {
    doc.text(`Livello: ${schedaData.livello}`, marginLeft, yPos);
    yPos += lineHeight;
  }

  if (schedaData.durataSettimane) {
    doc.text(`Durata: ${schedaData.durataSettimane} settimane`, marginLeft, yPos);
    yPos += lineHeight;
  }

  if (schedaData.note) {
    yPos += lineHeight / 2;
    doc.text('Note:', marginLeft, yPos);
    yPos += lineHeight;
    doc.setFontSize(10);
    const noteLines = doc.splitTextToSize(schedaData.note, maxWidth);
    noteLines.forEach(line => {
      checkPageBreak();
      doc.text(line, marginLeft, yPos);
      yPos += lineHeight - 1;
    });
    yPos += lineHeight / 2;
  }

  // Days
  const GIORNI_SETTIMANA = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
  
  GIORNI_SETTIMANA.forEach(giorno => {
    const dayData = schedaData.giorni?.[giorno];
    if (!dayData || !dayData.esercizi || dayData.esercizi.length === 0) return;

    checkPageBreak(30);
    
    // Day title
    yPos += lineHeight;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(giorno, marginLeft, yPos);
    yPos += lineHeight * 1.5;

    // Exercises
    doc.setFontSize(10);
    dayData.esercizi.forEach((item, idx) => {
      checkPageBreak(15);

      if (item.type === 'exercise') {
        doc.setFont(undefined, 'bold');
        doc.text(`${idx + 1}. ${item.nome}`, marginLeft + 5, yPos);
        yPos += lineHeight;
        
        doc.setFont(undefined, 'normal');
        const details = `   Serie: ${item.serie || '-'} | Ripetizioni: ${item.ripetizioni || '-'} | Recupero: ${item.recupero || '-'}`;
        doc.text(details, marginLeft + 5, yPos);
        yPos += lineHeight;
        
        if (item.note) {
          doc.setFontSize(9);
          doc.setTextColor(100);
          const noteLines = doc.splitTextToSize(`   Note: ${item.note}`, maxWidth - 10);
          noteLines.forEach(line => {
            checkPageBreak();
            doc.text(line, marginLeft + 5, yPos);
            yPos += lineHeight - 2;
          });
          doc.setTextColor(0);
          doc.setFontSize(10);
        }
        yPos += 2;
      } else if (item.type === 'superset-start') {
        doc.setFont(undefined, 'italic');
        doc.setTextColor(128, 0, 128);
        doc.text('▼ Inizio Superserie', marginLeft + 5, yPos);
        doc.setTextColor(0);
        yPos += lineHeight;
      } else if (item.type === 'superset-end') {
        doc.setFont(undefined, 'italic');
        doc.setTextColor(128, 0, 128);
        doc.text('▲ Fine Superserie', marginLeft + 5, yPos);
        doc.setTextColor(0);
        yPos += lineHeight;
      } else if (item.type === 'circuit-start') {
        doc.setFont(undefined, 'italic');
        doc.setTextColor(0, 128, 128);
        doc.text('▼ Inizio Circuito', marginLeft + 5, yPos);
        doc.setTextColor(0);
        yPos += lineHeight;
      } else if (item.type === 'circuit-end') {
        doc.setFont(undefined, 'italic');
        doc.setTextColor(0, 128, 128);
        doc.text('▲ Fine Circuito', marginLeft + 5, yPos);
        doc.setTextColor(0);
        yPos += lineHeight;
      }
    });

    yPos += lineHeight / 2;
  });

  // Save PDF
  const fileName = `Allenamento_${clientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

/**
 * Export nutrition card to PDF
 */
export const exportNutritionCardToPDF = (schedaData, clientName) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 20;
  const lineHeight = 7;
  const marginLeft = 15;
  const marginRight = 15;
  const maxWidth = pageWidth - marginLeft - marginRight;

  // Helper to check if we need a new page
  const checkPageBreak = (neededSpace = 20) => {
    if (yPos + neededSpace > pageHeight - 20) {
      doc.addPage();
      yPos = 20;
      return true;
    }
    return false;
  };

  // Title
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text('Piano Alimentazione', marginLeft, yPos);
  yPos += lineHeight * 2;

  // Client info
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.text(`Cliente: ${clientName}`, marginLeft, yPos);
  yPos += lineHeight;

  if (schedaData.obiettivo) {
    doc.text(`Obiettivo: ${schedaData.obiettivo}`, marginLeft, yPos);
    yPos += lineHeight;
  }

  if (schedaData.durataSettimane) {
    doc.text(`Durata: ${schedaData.durataSettimane} settimane`, marginLeft, yPos);
    yPos += lineHeight;
  }

  if (schedaData.note) {
    yPos += lineHeight / 2;
    doc.text('Note:', marginLeft, yPos);
    yPos += lineHeight;
    doc.setFontSize(10);
    const noteLines = doc.splitTextToSize(schedaData.note, maxWidth);
    noteLines.forEach(line => {
      checkPageBreak();
      doc.text(line, marginLeft, yPos);
      yPos += lineHeight - 1;
    });
    yPos += lineHeight / 2;
  }

  // Days
  const GIORNI_SETTIMANA = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
  const PASTI = ['Colazione', 'Spuntino', 'Pranzo', 'Spuntino', 'Cena'];
  
  GIORNI_SETTIMANA.forEach(giorno => {
    const dayData = schedaData.giorni?.[giorno];
    if (!dayData || !dayData.pasti) return;

    // Check if day has any foods
    const hasFoods = PASTI.some(pasto => dayData.pasti[pasto]?.alimenti?.length > 0);
    if (!hasFoods) return;

    checkPageBreak(30);
    
    // Day title
    yPos += lineHeight;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(giorno, marginLeft, yPos);
    yPos += lineHeight * 1.5;

    // Meals
    doc.setFontSize(10);
    PASTI.forEach(pasto => {
      const pastoData = dayData.pasti[pasto];
      if (!pastoData || !pastoData.alimenti || pastoData.alimenti.length === 0) return;

      checkPageBreak(15);
      
      doc.setFont(undefined, 'bold');
      doc.text(pasto, marginLeft + 5, yPos);
      yPos += lineHeight;

      // Foods
      doc.setFont(undefined, 'normal');
      pastoData.alimenti.forEach(alimento => {
        checkPageBreak();
        const foodText = `  • ${alimento.nome} - ${alimento.quantita}g`;
        doc.text(foodText, marginLeft + 8, yPos);
        yPos += lineHeight - 1;
        
        doc.setFontSize(9);
        doc.setTextColor(100);
        const nutritionText = `    Kcal: ${alimento.kcal || 0} | P: ${alimento.proteine || 0}g | C: ${alimento.carboidrati || 0}g | G: ${alimento.grassi || 0}g`;
        doc.text(nutritionText, marginLeft + 8, yPos);
        doc.setTextColor(0);
        doc.setFontSize(10);
        yPos += lineHeight - 1;
      });

      // Meal totals
      if (pastoData.totali) {
        checkPageBreak();
        doc.setFont(undefined, 'bold');
        doc.setFontSize(9);
        const totalText = `  Totale: Kcal ${pastoData.totali.kcal || 0} | P: ${pastoData.totali.proteine || 0}g | C: ${pastoData.totali.carboidrati || 0}g | G: ${pastoData.totali.grassi || 0}g`;
        doc.text(totalText, marginLeft + 8, yPos);
        doc.setFontSize(10);
        yPos += lineHeight;
      }

      yPos += 2;
    });

    // Daily totals
    if (dayData.totaliGiornalieri) {
      checkPageBreak(10);
      doc.setFont(undefined, 'bold');
      doc.setFontSize(11);
      const dailyTotal = `Totale Giornaliero: Kcal ${dayData.totaliGiornalieri.kcal || 0} | P: ${dayData.totaliGiornalieri.proteine || 0}g | C: ${dayData.totaliGiornalieri.carboidrati || 0}g | G: ${dayData.totaliGiornalieri.grassi || 0}g`;
      doc.text(dailyTotal, marginLeft + 5, yPos);
      doc.setFontSize(10);
      yPos += lineHeight * 1.5;
    }
  });

  // Integration notes
  if (schedaData.integrazione) {
    checkPageBreak(20);
    yPos += lineHeight;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Integrazione', marginLeft, yPos);
    yPos += lineHeight;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const intLines = doc.splitTextToSize(schedaData.integrazione, maxWidth);
    intLines.forEach(line => {
      checkPageBreak();
      doc.text(line, marginLeft, yPos);
      yPos += lineHeight - 1;
    });
  }

  // Save PDF
  const fileName = `Alimentazione_${clientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
