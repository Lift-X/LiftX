<script>
    import Exercise from "../Components/ExerciseView.svelte";
    export let id;
    export async function load_json() {
        const response = await fetch("/api/workouts/" + id + "/json");
        const responseJson = await response.json();
        if (responseJson.error != null) {
            // Hide workout section
            document.getElementById("workout").style.display = "none";
            throw new Error(responseJson.error);
        } else {
            return responseJson;
        }
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

<svelte:head>
    {#await data}
        <title>Loading...</title>
    {:then json}
        <title>WLRS - Workout: {json.title}</title>
    {:catch error}
        <title>WLRS - {error}</title>
    {/await}
</svelte:head>


<div class="separator" id="metadata">
    {#await data}
        <p>Loading... please wait</p>
    {:then json}
        <h1>Workout: {json.title}</h1>
        <hr>
        <p>Duration: { duration_from_secs( json.end_time - json.start_time )}</p>
        <p>By: {json.user}</p>
    {:catch error}
        <center id="404">
            <h1>404</h1>
            <hr>
            <p>{error}</p>
        </center>
    {/await}
</div>

<div class="separator" id="workout">
    {#await data}
        <p>Loading... please wait</p>
    {:then json}
        <h1>Exercises</h1>
        <hr>
        {#each json.exercises as exercise}
            <Exercise exercise={exercise} view_only=true />
        {/each}
    {:catch error}
        <p>{error}</p>
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
