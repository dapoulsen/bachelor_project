export interface IncrementStrategy {
    value: number;
    increment: () => void;
}

export class AlphaIS implements IncrementStrategy {
    value = $state(0);
    
	increment() {
        this.value += 1;   
    }
}

export class BetaIS implements IncrementStrategy {
    value = $state(0);
    
	increment() {
        this.value += 2;   
    }
}