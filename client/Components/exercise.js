import { json_data } from "./json_store";
import {get} from "svelte/store";
export function modifysets() {
    // Delete previously created sets, if any
    let setslist = document.getElementsByClassName("set");
    while (setslist.length > 0) {
        setslist[0].remove();
    }

    let sets = document.getElementById("sets").value;
    // Only render a max of 100 sets, for fucks sake how much time do you spend in the gym?
    for (let i = 0; i < sets && i < 100; i++) {
        let set = document.createElement("div");

        // Reps
        set.className = "set";
        let reps = document.createElement("input");
        reps.type = "number";
        reps.className = "reps numberform";
        reps.placeholder = "Reps";
        reps.min = "0";
        reps.max = "100";
        reps.required = true;

        // Weight
        let weight = document.createElement("input");
        weight.type = "number";
        weight.className = "weight numberform";
        weight.placeholder = "Weight";
        weight.required = true;

        // Weight Unit
        let weightunit = document.createElement("select");
        weightunit.className = "weightunit";
        // When any of the options are changed, change all the weight units to the new one
        weightunit.onchange = function () {
            let list = document.getElementsByClassName("weightunit");
            for (let i = 0; i < list.length; i++) {
                list[i].value = weightunit.value;
            }
        };
        let option1 = document.createElement("option");
        option1.value = "lbs";
        option1.text = "Pounds";
        let option2 = document.createElement("option");
        option2.value = "kgs";
        option2.text = "Kilograms";
        weightunit.appendChild(option1);
        weightunit.appendChild(option2);

        // Reps in Reserve
        let rir = document.createElement("input");
        rir.type = "number";
        rir.className = "rir numberform";
        rir.placeholder = "Reps in Reserve (optional)";
        rir.maxLength = "10.0";
        rir.required = true;
        rir.step = "0.5";

        // Build
        set.appendChild(reps);
        set.appendChild(weight);
        set.appendChild(weightunit);
        set.appendChild(rir);
        document.getElementById("setsdiv").appendChild(set);
    }
}

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

   //render();
}

/*
function render() {
    // Remove any elements under the exercises id
    let exercises_div = document.getElementById("exercises");
    exercises_div.innerHTML = "<h1>Exercises</h1><hr>";

    let arr = get(json_data);
    console.log(arr);

    // Render each exercise
    for (let i = 0; i < arr.exercises.length; i++) {
        let exercise = arr.exercises[i];
        let exercise_div = document.createElement("div");
        exercise_div.className = "exercise";
        exercise_div.id = "exercise-" + i;
        exercise_div.innerHTML = `
        <h2>${exercise.name}</h2>
        <ul>
            ${exercise.sets.map(set => `
                <li>
                    <p>Reps: ${set.reps} x ${set.weight.weight}${set.weight.weightunit} - ${set.reps_in_reserve}RiR</p>
                </li>
            `).join("")}
        </ul>
        <button class="button delete-button" on:click=${`() => delete_exercise(${i})`}>Delete Exercise</button>
        `;
        exercises_div.appendChild(exercise_div);
    }
}
*/
