<script context="module">
import { json_data } from "./json_store";
import SetEntryForm from "./SetEntryForm.svelte";

export function addexercise() {
    let exercise = {
        name: "",
        comments: "",
        sets: [],
    }

    // Name
    exercise.name = document.getElementById("exercisename").value;

    // Comments
    exercise.comments = document.getElementById("comments").value;

    // Sets
    for (let i = 0; i < document.getElementsByClassName("set").length; i++) {

        // Special handling for rir, as it is optional
        let rir_val = document.getElementsByClassName("rir")[i].value;
        if (rir_val == "" || rir_val == null) {
            rir_val = 0;
        }

        let set = {
            reps: document.getElementsByClassName("reps")[i].value,
            reps_in_reserve: rir_val,
            weight: {
                weight: document.getElementsByClassName("weight")[i].value,
                weightunit: document.getElementsByClassName("weightunit")[i].value,
            },
        }
        exercise.sets.push(set);
    }


    // Check for empty fields
    if (exercise.name == "" || exercise.sets.length == 0 || exercise.sets[0].reps == "" || exercise.sets[0].weight == "" || exercise.sets[0].rir == "") {
        alert("Please fill in all fields!");
        return;
    }

    // Hidden at the start when exercises are empty, unhide.
    document.getElementById("exercises").classList.remove("hidden");

    json_data.update(function (data) {
        data.exercises.push(exercise);
        return data;
    });

}
</script>