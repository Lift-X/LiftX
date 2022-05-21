<script>
    import {get_current_user, json_data} from "../Components/json_store.js";
    import { onMount } from 'svelte';
    import Time from "svelte-time";
    import Exercise from "../Components/ExerciseView.svelte";

    let login_status = false;
    let workouts = [];
    onMount(async () => {
        get_current_user();
        login_status = (json_data != "") ? true : false;
        // Fetch 3 of the latest workouts
        if (login_status) {
            const response = await fetch("/api/user/workouts/3");
            const responseJson = await response.json();
            if (responseJson.error != null) {
                // Hide workout section
                console.log(response.status)
                document.getElementById("workout").style.display = "none";
                throw new Error(responseJson.error);
            } else {
                workouts = responseJson.workouts;
            }
        }});
    function redirect() {
        window.location.href = "/login";
    }
</script>

{#if login_status}
<div>
    <div id="recentpanel" class="separator">
        <h1>Recent Workouts</h1>
        <hr>
        <div id="recents" class="subpanel">
            {#each workouts as workout}
            <div class="workout-summary">
                <h2><a href="/workouts/{workout.uuid}">{workout.title} - <Time timestamp="{workout.start_time * 1000}"></Time></a></h2>
                <hr/>
                {#each workout.exercises as exercise}
                    <Exercise exercise={exercise} view_only=true></Exercise>
                {/each}
            </div>
            {/each}
        </div>
    </div>
</div>
{:else}
<div display="flex">
    <div>
        <h1>Recent Workouts</h1>
        <hr>
        <p>You must be logged in to view this page.</p>
        <button onclick="redirect()">Login</button>
    </div>
</div>
{/if}

<style>
    .workout-summary > h2 > a {
        text-decoration: none;
        color: white;
    }

    .workout-summary {
        padding: 10px;
        margin: 10px;
        display: block;
        max-width: 300px;
        max-height: 700px;
        flex:auto;
        background-color: #3f3f3f;
        border-radius: 25px;
    }

    #recents {
        flex-direction: row;
        display: flex;
        flex-wrap: wrap;
    }

    #recentpanel {
        max-width: 960px;
    }
</style>