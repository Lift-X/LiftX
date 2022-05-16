import { json_data } from "./json_store";
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
        rir.placeholder = "Reps in Reserve";
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
    console.log("addexercise");

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
        let set = {
            reps: document.getElementsByClassName("reps")[i].value,
            reps_in_reserve: document.getElementsByClassName("rir")[i].value,
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

    json_data.update(function (data) {
        data.exercises.push(exercise);
        return data;
    });

    // Render
    let exercises = document.getElementById("exercises");
    let exerciseDiv = document.createElement("div");
    exerciseDiv.className = "exercise";
    exerciseDiv.innerHTML = `
    <h2>${exercise.name}</h2>
    <ul>
        ${exercise.sets.map(set => `
            <li>
                <p>Reps: ${set.reps} x ${set.weight.weight}${set.weight.weightunit} - ${set.reps_in_reserve}RiR</p>
            </li>
        `).join("")}
    </ul>
`;
    exercises.appendChild(exerciseDiv);

    //json_data.exercises.push(exercise);
    //$json_data_var.update(value => value.exercises.push(exercise));
    //console.log({ json_data_var });
}