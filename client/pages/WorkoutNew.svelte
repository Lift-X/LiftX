<script>
import SveltyPicker from "svelty-picker";
import Exercise from "../Components/ExerciseView.svelte";
import {addexercise} from "../Components/Exercise.svelte";
import {json_data} from "../Components/json_store.js";
import SetEntryForm from "../Components/SetEntryForm.svelte";
import {get_current_user} from "../Components/json_store.js";
import {onMount} from "svelte";
let login_status = false;
onMount(async () => {
    get_current_user();
    login_status = (json_data.user != "") ? true : false;
});

$: start_time_bind = null;
$: start_time = null;
$: end_time = null;
$: duration_bind = 0;

$: set_count_bind = 0;

function handle_time(time) {
    let new_time = Math.floor(new Date(time).getTime() / 1000);
    {start_time = new_time};
    {$json_data.start_time = new_time};

    return new_time;
}

function handle_duration(time, duration) {
    let end = handle_time(time) + (duration * 60);
    {end_time = end};
    {$json_data.end_time = end};

    return end;
}

function validate_json() {
    let valid = true;

    if ($json_data.exercises.length == 0) {
        valid = false;
    }

    if ($json_data.start_time < 10000) {
        valid = false;
    }

    if ($json_data.end_time < 10000) {
        valid = false;
    }

    if ($json_data.end_time < $json_data.start_time) {
        valid = false;
    }

    if ($json_data.user == "") {
        valid = false;
    }

    // Convert any stringed numbers to numbers
    for (let i = 0; i < $json_data.exercises.length; i++) {
        for (let j = 0; j < $json_data.exercises[i].sets.length; j++) {
            $json_data.exercises[i].sets[j].reps = Number($json_data.exercises[i].sets[j].reps);
            $json_data.exercises[i].sets[j].weight.weight = Number($json_data.exercises[i].sets[j].weight.weight);
        }
    }
    return valid;
}

function deleteExercise(exercise) {
    let index = $json_data.exercises.indexOf(exercise);

    if (index > -1) {
        json_data.update(data => {
            data.exercises.splice(index, 1);
            return data;
        });
    }
}

function post() {
    if (validate_json()) {
        let data = JSON.stringify($json_data);
        let url = "/api/workouts/json";
        fetch(url, {
            method: "POST",
            body: data,
            headers: {
                "Content-Type": "application/json"
            }
        }).then(response => {
            if (response.status == 200) {
                console.log("Successfully posted workout, redirecting...");
                window.location.href = response.url;
            } else {
                // TODO: Add notification ui for failed post
                console.log("Failed to post workout: " + response.status);
            }
        });
    } else {
        console.log("Invalid workout!");
    }
}
</script>

<svelte:head>
    <title>WLRS - New Workout</title>
    </svelte:head>

    <div class="separator" id="metadata">
        <h1>New Workout: <input type="text" name="title" placeholder="Push Day" bind:value="{$json_data.title}" /></h1>
        <hr>
        <p>By: {$json_data.user}</p>
        <p>Start: <SveltyPicker inputClasses="form-control" format="yyyy-mm-dd hh:ii" bind:value={start_time_bind} on:change={handle_time(start_time_bind)}></SveltyPicker></p>
        <p>Duration: <input type="number" class="form-control" id="duration" placeholder="Duration in minutes" min="0" max="360" required bind:value={duration_bind} on:change={handle_duration(start_time_bind, duration_bind)}><span class="validity"></span></p>
    </div>

    <div class="separator" id="create">
        <h1>Add Exercise</h1>
        <hr>
        <p>Exercise: <input type="text" class="form-control" id="exercisename" placeholder="Bench Press" maxlength="100" required><span class="validity"></span></p>
        <p>Comments: <input type="text" class="form-control" id="comments" placeholder="Comments (optional)" maxlength="5000"><span class="validity"></span></p>
        <p>Sets: <input type="number" class="form-control numberform" id="sets" placeholder="Sets" min="0" max="25" required bind:value={set_count_bind} ><span class="validity"></span></p>
        <div id="setsdiv">
            {#if set_count_bind > 0 && set_count_bind <= 25}
            {#each {length: set_count_bind} as _}
            <SetEntryForm/>
                {/each}
                {/if}
                </div>
                <button type="submit" class="btn btn-primary" id="add-exercise" on:click="{addexercise}">Submit</button>
                </div>
                <div class="separator hidden" id="exercises">
                    <h1>Exercises</h1>
                    <hr>
                    {#each $json_data.exercises as exercise}
                    <Exercise exercise={exercise} on:delete={deleteExercise(exercise)} ></Exercise>
                    {/each}
                </div>

                <div class="separator" id="submit">
                    <h1>Submit</h1>
                    <hr>
                    <button type="submit" class="btn btn-primary" id="submit-workout" on:click="{post}">Submit</button>
                </div>

                <hr>
                <code lang="json">
                    <pre>
                        {JSON.stringify($json_data, null, 2)}
                    </pre>
                </code>
<style>
.separator {
    background: #2b2b2b;
    border-radius: 33px;
    padding: 15px;
    margin: 10px;
}

input:invalid+span:after {
    content: '⛔';
    padding-left: 5px;
}

input:valid+span:after {
    content: '✅';
    padding-left: 5px;
}

:global(.numberform) {
    max-width: 150px;
}

:global(.delete-button) {
    background-color: #fa6464;
    border: none;
    color: white;
    padding: 15px 20px;
    text-align: center;
    text-decoration: none;
    display: inline-block;
    font-size: 16px;
    border-radius: 15px;
}
</style>
