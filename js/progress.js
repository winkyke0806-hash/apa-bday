const STORAGE_KEY = 'apu-bday-progress';

export function getProgress() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export function isRoomUnlocked(roomId) {
  return !!getProgress()[roomId];
}

export function unlockRoom(roomId) {
  const progress = getProgress();
  progress[roomId] = { unlockedAt: Date.now() };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    console.warn('localStorage nem elérhető — progress nem mentve');
  }
}

export function getUnlockedCount() {
  return Object.keys(getProgress()).length;
}

export function areAllRoomsUnlocked(totalRooms) {
  return getUnlockedCount() >= totalRooms;
}

export function resetProgress() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // silent fail
  }
}
