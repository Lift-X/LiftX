<script>
    import Nav from "../Nav.svelte";
    import Time, { svelteTime } from "svelte-time";
    export let id;
    export async function load_json() {
        const response = await fetch("/workouts/" + id + "/json");
        const responseJson = await response.json();
        return responseJson;
    }
    export function duration_from_secs(time) {
        let hours = Math.floor(time / 3600);
        let minutes = Math.floor((time - hours * 3600) / 60);
        let seconds = time - hours * 3600 - minutes * 60;
        return hours + "h " + minutes + "m " + seconds + "s";
    }
    let json_data = load_json();
    $: data = json_data;
</script>

<div class="separator" id="metadata">
    {#await data}
        <p>Loading... please wait</p>
    {:then json}
        <h1>Workout: {json.title}</h1>
        <hr>
        <p>Duration: { duration_from_secs( json.end_time - json.start_time )}</p>
        <p>By: {json.user}</p>
    {/await}
</div>

<div class="separator" id="workout">
    {#await data}
        <p>Loading... please wait</p>
    {:then json}
        <h1>Exercises</h1>
        <hr>
        {#each json.exercises as exercise}
            <div class="exercise">
                <h2>{exercise.exercise}</h2>
                {#if exercise.comments != ""}
                    <p>Comments: {exercise.comments}</p>
                {/if}
                <ul>
                {#each exercise.sets as set}
                        <li>{set.reps} x {set.weight.weight} {set.weight.weight_unit} - {set.reps_in_reserve}RiR</li>
                {/each}
                </ul>
            </div>
        {/each}
    {/await}
</div>

<style>
    .separator {
        background: #2b2b2b;
        border-radius: 33px;
        padding: 15px;
        margin: 10px;
    }
</style>
