<script>
    import SveltyPicker from "svelty-picker";
    import { writable } from "svelte/store";
    let user = "John Doe"; // replace once auth is implemented
    import {modifysets} from "../Components/exercise.js";
    import {addexercise} from "../Components/exercise.js";
    let json_data = writable({});
    export {json_data};
    console.log(json_data);
</script>

<div class="separator" id="metadata">
    <h1>New Workout</h1>
    <hr>
    <p>By: {user}</p>
    <p>Start: <SveltyPicker inputClasses="form-control" format="yyyy-mm-dd hh:ii"></SveltyPicker></p>
    <p>Duration: <input type="number" class="form-control" id="duration" placeholder="Duration in minutes" min="0" max="360" required><span class="validity"></span></p>
</div>

<div class="separator" id="create">
    <h1>Add Exercise</h1>
    <hr>
    <p>Exercise: <input type="text" class="form-control" id="exercisename" placeholder="Bench Press" maxlength="100" required><span class="validity"></span></p>
    <p>Comments: <input type="text" class="form-control" id="comments" maxlength="5000" placeholder="Comments (optional)"><span class="validity"></span></p>
    <p>Sets: <input type="number" class="form-control numberform" id="sets" placeholder="Sets" min="0" max="100" required on:input="{modifysets}"><span class="validity"></span></p>
    <div id="setsdiv"></div>
    <button type="submit" class="btn btn-primary" id="add-exercise" on:click="{addexercise}">Submit</button>
</div>

<div class="separator" id="exercises">
    <h1>Exercises</h1>
    <hr>
</div>

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

</style>
