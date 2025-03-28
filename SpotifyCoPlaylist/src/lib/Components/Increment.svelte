<script lang="ts">
import { type IncrementStrategy, AlphaIS, BetaIS } from "$lib/IncrementStrategy.svelte";
// import { IncrementStrategy } from "./IncrementStrategy.svelte";

// svelte-ignore non_reactive_update
let incState: IncrementStrategy = new AlphaIS();

let stratState = $state({
    step: 0,
    strat: incState
});

// Function to switch strategy and increment step
function switchStrategy(newStrategy: IncrementStrategy) {
        stratState.strat = newStrategy;
        stratState.step++; // Move to next step
    }

</script>

<div>
    {#if stratState.step === 0}
    <button class="bg-blue-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded" onclick = {() => switchStrategy(new AlphaIS())}> Alpha </button>
    <button class="bg-blue-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded" onclick = {() => switchStrategy(new BetaIS())}> Beta </button>
    {:else}
    <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onclick = {() => stratState.strat.increment()}> {stratState.strat.value} </button>
    {/if}
    
</div>