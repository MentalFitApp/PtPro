#!/usr/bin/env python3
"""
Script per avvolgere il return di ogni pagina con UnifiedLayout
"""
import os
import re

# Map filename to role
role_map = {
    'admin': ['Clients', 'ClientDetail', 'EditClient', 'NewClient', 'AdminAnamnesi', 
              'BusinessHistory', 'Statistiche', 'Analytics', 'Collaboratori', 
              'CollaboratoreDetail', 'Dipendenti', 'CourseAdmin', 'CourseContentManager',
              'GuideManager', 'GuideCapture', 'SuperAdminSettings'],
    'coach': ['CoachClients', 'CoachClientDetail', 'CoachAnamnesi', 'CoachSchede', 'CoachUpdates'],
    'client': ['ClientAnamnesi', 'ClientChecks', 'ClientPayments', 'ClientSchedaAlimentazione',
               'ClientSchedaAlimentazioneEnhanced', 'ClientSchedaAllenamento'],
    'collaboratore': ['CollaboratoreDashboard']
}

def get_role_from_path(filepath):
    """Determina il role dal percorso"""
    if '/admin/' in filepath:
        return 'admin'
    elif '/coach/' in filepath:
        return 'coach'
    elif '/client/' in filepath:
        return 'client'
    elif '/collaboratore/' in filepath:
        return 'collaboratore'
    else:
        return 'admin'  # default

def wrap_return(filepath):
    """Avvolge il return con UnifiedLayout se non già fatto"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check se già wrapped
    if '<UnifiedLayout' in content and '</UnifiedLayout>' in content:
        print(f"✓  Già wrapped: {filepath}")
        return True
    
    role = get_role_from_path(filepath)
    
    # Trova il return statement
    # Pattern: function Component(...) { ... return ( ... ) }
    # Cerchiamo il return più esterno
    
    # Trova l'ultimo return (
    return_pattern = r'(return\s*\()'
    matches = list(re.finditer(return_pattern, content, re.MULTILINE))
    
    if not matches:
        print(f"⚠️  Nessun 'return (' trovato in: {filepath}")
        return False
    
    # Usa l'ultimo return (dovrebbe essere quello principale del component)
    last_return = matches[-1]
    start_pos = last_return.end()
    
    # Trova la parentesi di chiusura corrispondente
    # Conta parentesi aperte/chiuse
    depth = 1
    pos = start_pos
    while pos < len(content) and depth > 0:
        if content[pos] == '(':
            depth += 1
        elif content[pos] == ')':
            depth -= 1
        pos += 1
    
    if depth != 0:
        print(f"❌ Parentesi non bilanciate in: {filepath}")
        return False
    
    end_pos = pos - 1  # posizione della parentesi di chiusura
    
    # Estrai il contenuto del return
    return_content = content[start_pos:end_pos]
    
    # Crea il wrapped version
    wrapped_content = f"""<UnifiedLayout role="{role}" userName={{userName}} userEmail={{userEmail}}>
      {return_content.strip()}
    </UnifiedLayout>"""
    
    # Sostituisci
    new_content = content[:start_pos] + '\n      ' + wrapped_content + '\n    ' + content[end_pos:]
    
    # Salva
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"✅ Wrapped: {filepath}")
    return True

def main():
    basedir = '/workspaces/PtPro'
    os.chdir(basedir)
    
    pages = [
        # Admin  
        'src/pages/admin/Clients.jsx',
        'src/pages/admin/ClientDetail.jsx',
        'src/pages/admin/EditClient.jsx',
        'src/pages/admin/NewClient.jsx',
        'src/pages/admin/AdminAnamnesi.jsx',
        'src/pages/admin/BusinessHistory.jsx',
        'src/pages/admin/Statistiche.jsx',
        'src/pages/admin/Analytics.jsx',
        'src/pages/admin/Collaboratori.jsx',
        'src/pages/admin/CollaboratoreDetail.jsx',
        'src/pages/admin/Dipendenti.jsx',
        
        # Client
        'src/pages/client/ClientAnamnesi.jsx',
        'src/pages/client/ClientChecks.jsx',
        'src/pages/client/ClientPayments.jsx',
        
        # Coach
        'src/pages/coach/CoachClients.jsx',
        'src/pages/coach/CoachClientDetail.jsx',
        'src/pages/coach/CoachAnamnesi.jsx',
        'src/pages/coach/CoachSchede.jsx',
        'src/pages/coach/CoachUpdates.jsx',
        
        # Collaboratore
        'src/pages/collaboratore/CollaboratoreDashboard.jsx',
    ]
    
    print("🚀 Inizio wrapping pagine...\n")
    
    wrapped = 0
    skipped = 0
    errors = 0
    
    for page in pages:
        if not os.path.exists(page):
            print(f"⚠️  File non trovato: {page}")
            errors += 1
            continue
            
        try:
            if wrap_return(page):
                wrapped += 1
            else:
                errors += 1
        except Exception as e:
            print(f"❌ Errore con {page}: {e}")
            errors += 1
    
    print(f"\n📊 Risultati:")
    print(f"   ✅ Wrapped: {wrapped}")
    print(f"   ⚠️  Errori: {errors}")
    print(f"\n✨ Completato!")

if __name__ == '__main__':
    main()
