<script>
    export let exercise;
    export let view_only = false; // Hide delete button if true

    import { createEventDispatcher } from "svelte";
    const dispatch = createEventDispatcher();

    function onDelete() {
        dispatch("delete", exercise); // emit remove event
    }
</script>

<div class="exercise">
    <h3>{exercise.exercise}</h3>
    <ul class="list-disc">
        {#each exercise.sets as set}
            <li class="ml-4">
                {set.reps} x {set.weight.weight}{set.weight.weight_unit}
                {#if set.reps_in_reserve != "" && set.reps_in_reserve != null}
                    - {set.reps_in_reserve}RiR{/if}
            </li>
        {/each}
    </ul>
    {#if exercise.comments != ""}
        <p>Comments: {exercise.comments}</p>
    {/if}
    {#if !view_only}
        <button class="btn btn-primary hover:bg-primary-500 mt-5" on:click={onDelete}>Delete</button>
    {/if}
</div>
