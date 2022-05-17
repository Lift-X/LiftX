<script>
    export let exercise;
    import { json_data } from "./json_store"

    import { createEventDispatcher } from 'svelte'
    const dispatch = createEventDispatcher()

    function onDelete() {
        dispatch('delete', exercise) // emit remove event
    }
</script>



<div class="exercise">
    <h3>{exercise.name}</h3>
    <ul>
        {#each exercise.sets as set}
            <li>{set.reps} x {set.weight.weight}{set.weight.weightunit}{#if set.reps_in_reserve != "" && set.reps_in_reserve != null} - {set.reps_in_reserve}RiR{/if}</li>
        {/each}
    </ul>
    {#if exercise.comments != ""}
        <p>Comments: {exercise.comments}</p>
    {/if}
    <button class="button delete-button" on:click={onDelete}>Delete Exercise</button>
</div>