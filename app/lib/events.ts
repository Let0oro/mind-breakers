
type LevelUpCallback = (level: number) => void;

class EventEmitter {
    private listeners: LevelUpCallback[] = [];

    subscribe(callback: LevelUpCallback): () => void {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    }

    emit(level: number) {
        this.listeners.forEach(callback => callback(level));
    }
}

export const levelUpEvent = new EventEmitter();
