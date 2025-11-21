import { db } from '../firebase';
import { collection, query, orderBy, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';

/**
 * Calcola il livello corrente di un utente basato sui suoi progressi
 * @param {string} userId - ID dell'utente
 * @returns {Promise<Object>} - Oggetto con livello corrente e progressi
 */
export async function calculateUserLevel(userId) {
  try {
    // Prima controlla se c'è un livello manuale impostato
    const userLevelRef = doc(db, 'user_levels', userId);
    const userLevelSnap = await getDoc(userLevelRef);

    if (userLevelSnap.exists()) {
      const manualLevel = userLevelSnap.data().level;
      return {
        level: manualLevel,
        xp: 0, // Livello manuale, non calcolato
        nextLevelXP: 0,
        isManual: true
      };
    }

    // Se non c'è livello manuale, calcola basato sui progressi
    // Ottieni tutti i livelli ordinati per punti minimi
    const levelsQuery = query(collection(db, 'levels'), orderBy('minPoints', 'asc'));
    const levelsSnapshot = await getDocs(levelsQuery);
    const levels = levelsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Ottieni i progressi dell'utente
    const userProgressRef = doc(db, 'user_progress', userId);
    const userProgressSnap = await getDoc(userProgressRef);

    let userProgress = {
      posts: 0,
      reactions: 0,
      comments: 0,
      courses_completed: 0,
      total_points: 0
    };

    if (userProgressSnap.exists()) {
      userProgress = { ...userProgress, ...userProgressSnap.data() };
    }

    // Trova il livello corrente
    let currentLevel = null;
    let nextLevel = null;

    for (let i = levels.length - 1; i >= 0; i--) {
      const level = levels[i];
      const meetsRequirements = checkLevelRequirements(userProgress, level);

      if (meetsRequirements) {
        currentLevel = level;
        nextLevel = levels[i + 1] || null;
        break;
      }
    }

    // Se non ha raggiunto nessun livello, prendi il primo
    if (!currentLevel && levels.length > 0) {
      currentLevel = levels[0];
      nextLevel = levels[1] || null;
    }

    return {
      level: currentLevel ? currentLevel.level : 1,
      xp: userProgress.total_points || 0,
      nextLevelXP: nextLevel ? nextLevel.minPoints : 0,
      isManual: false
    };
  } catch (error) {
    console.error('Error calculating user level:', error);
    // Ritorna un livello di default se ci sono errori di permessi
    return {
      level: 1,
      xp: 0,
      nextLevelXP: 0,
      isManual: false
    };
  }
}

/**
 * Verifica se un utente soddisfa i requisiti per un livello
 * @param {Object} userProgress - Progressi dell'utente
 * @param {Object} level - Livello da verificare
 * @returns {boolean}
 */
function checkLevelRequirements(userProgress, level) {
  if (!level.requirements) return userProgress.total_points >= level.minPoints;

  const requirements = level.requirements;

  return (
    userProgress.posts >= (requirements.posts || 0) &&
    userProgress.reactions >= (requirements.reactions || 0) &&
    userProgress.comments >= (requirements.comments || 0) &&
    userProgress.courses_completed >= (requirements.courses_completed || 0)
  );
}

/**
 * Aggiorna i progressi di un utente
 * @param {string} userId - ID dell'utente
 * @param {Object} updates - Aggiornamenti ai progressi
 */
export async function updateUserProgress(userId, updates) {
  try {
    const userProgressRef = doc(db, 'user_progress', userId);
    const userProgressSnap = await getDoc(userProgressRef);

    let currentProgress = {
      posts: 0,
      reactions: 0,
      comments: 0,
      courses_completed: 0,
      total_points: 0
    };

    if (userProgressSnap.exists()) {
      currentProgress = { ...currentProgress, ...userProgressSnap.data() };
    }

    // Aggiorna i progressi
    const newProgress = {
      ...currentProgress,
      ...updates,
      updatedAt: new Date()
    };

    // Ricalcola punti totali (logica semplice per ora)
    newProgress.total_points =
      newProgress.posts * 10 +
      newProgress.reactions * 2 +
      newProgress.comments * 5 +
      newProgress.courses_completed * 50;

    await setDoc(userProgressRef, newProgress);

    // Verifica se l'utente ha sbloccato nuovi rewards
    await checkAndUnlockRewards(userId);

    return newProgress;
  } catch (error) {
    console.error('Error updating user progress:', error);
    throw error;
  }
}

/**
 * Verifica e sblocca rewards per un utente
 * @param {string} userId - ID dell'utente
 */
async function checkAndUnlockRewards(userId) {
  try {
    const userLevel = await calculateUserLevel(userId);
    if (!userLevel.currentLevel) return;

    // Ottieni tutti i rewards
    const rewardsQuery = query(collection(db, 'rewards'));
    const rewardsSnapshot = await getDocs(rewardsQuery);
    const rewards = rewardsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Ottieni rewards già sbloccati dall'utente
    const userRewardsRef = doc(db, 'user_rewards', userId);
    const userRewardsSnap = await getDoc(userRewardsRef);
    const unlockedRewards = userRewardsSnap.exists() ? userRewardsSnap.data().rewards || [] : [];

    // Trova rewards da sbloccare
    const rewardsToUnlock = rewards.filter(reward =>
      reward.requiredLevel === userLevel.currentLevel.id &&
      !unlockedRewards.includes(reward.id)
    );

    if (rewardsToUnlock.length > 0) {
      const updatedRewards = [...unlockedRewards, ...rewardsToUnlock.map(r => r.id)];

      await setDoc(userRewardsRef, {
        rewards: updatedRewards,
        unlockedAt: {
          ...userRewardsSnap.data()?.unlockedAt,
          ...rewardsToUnlock.reduce((acc, reward) => ({
            ...acc,
            [reward.id]: new Date()
          }), {})
        },
        updatedAt: new Date()
      });

      // Qui potresti aggiungere notifiche per i rewards sbloccati
      console.log(`User ${userId} unlocked rewards:`, rewardsToUnlock.map(r => r.name));
    }
  } catch (error) {
    console.error('Error checking rewards:', error);
  }
}

/**
 * Ottieni i rewards sbloccati da un utente
 * @param {string} userId - ID dell'utente
 * @returns {Promise<Array>} - Array di rewards sbloccati
 */
export async function getUserRewards(userId) {
  try {
    const userRewardsRef = doc(db, 'user_rewards', userId);
    const userRewardsSnap = await getDoc(userRewardsRef);

    if (!userRewardsSnap.exists()) return [];

    const unlockedRewardIds = userRewardsSnap.data().rewards || [];

    // Ottieni i dettagli dei rewards
    const rewardsPromises = unlockedRewardIds.map(async (rewardId) => {
      const rewardDoc = await getDoc(doc(db, 'rewards', rewardId));
      return rewardDoc.exists() ? { id: rewardDoc.id, ...rewardDoc.data() } : null;
    });

    const rewards = await Promise.all(rewardsPromises);
    return rewards.filter(reward => reward !== null);
  } catch (error) {
    console.error('Error getting user rewards:', error);
    return [];
  }
}

/**
 * Verifica se un utente ha accesso a un reward specifico
 * @param {string} userId - ID dell'utente
 * @param {string} rewardId - ID del reward
 * @returns {Promise<boolean>}
 */
export async function hasRewardAccess(userId, rewardId) {
  try {
    const userRewards = await getUserRewards(userId);
    return userRewards.some(reward => reward.id === rewardId);
  } catch (error) {
    console.error('Error checking reward access:', error);
    return false;
  }
}