<script>
    import { get_current_user, json_data } from "../Components/json_store.js";
    import { onMount } from "svelte";
    import Time from "svelte-time";
    import Exercise from "../Components/ExerciseView.svelte";
    import { get } from "svelte/store";
    import { LinkedChart } from "svelte-tiny-linked-charts";
    let login_status = false;
    let data = {};
    let workouts = [];
    function volume_data_to_hashmap(json) {
        for (let i = 0; i < json.length; i++) {
            let item = json[i];
            // TODO: respect user settings
            if (item.volume.weight_unit == "kgs") {
                data[item.date] = (item.volume.weight * 2.204623).toFixed(2);
            } else {
                data[item.date] = (item.volume.weight).toFixed(2);
            }

        }
        console.log(data);
    }
    onMount(async () => {
        await get_current_user();
        let json_data_store = get(json_data);
        login_status = json_data_store.user != "" ? true : false;
        if (!login_status) {
            // redirect to login
            window.location.href = "/login";
        } else {
            // Fetch 3 of the latest workouts
            const response = await fetch("/api/user/workouts/3");
            const responseJson = await response.json();
            if (responseJson.error != null) {
                throw new Error(responseJson.error);
            } else {
                workouts = responseJson.workouts;
            }
        }

        // Get graph data for volume
        const response = await fetch("/api/graphs/volume/30");
        const responseJson = await response.json();
        if (responseJson.error != null) {
            throw new Error(responseJson.error);
        } else {
            volume_data_to_hashmap(responseJson.volume);
        }
    });
</script>

{#if login_status}
    <div id="content">
        <div
            id="recentpanel"
            class="separator"
            style="width: {workouts.length * 320}px;"
        >
            <h1>Recent Workouts</h1>
            <hr />
            <div id="recents" class="subpanel">
                {#if workouts.length > 0}
                    {#each workouts as workout}
                        <div class="workout-summary">
                            <h2>
                                <a href="/workouts/{workout.uuid}"
                                    >{workout.title} - <Time
                                        timestamp={workout.start_time * 1000}
                                    /></a
                                >
                            </h2>
                            <hr />
                            {#each workout.exercises as exercise}
                                <Exercise {exercise} view_only="true" />
                            {/each}
                        </div>
                    {/each}
                {:else if workouts.length == 0}
                    <div class="workout-summary" id="add-panel">
                        <h2>Add a workout</h2>
                        <hr />
                        <a href="/workouts/new"
                            ><div id="add">
                                <center>
                                    <p>+</p>
                                </center>
                            </div>
                        </a>
                    </div>
                {/if}
            </div>
        </div>
        <div id="graphpanel" class="separator">
            <h1>Workout Volume - 30 Days</h1>
            <p>
                Total workout volume is not a complete sign of progression or
                not, but can be used to get an <i>idea</i> of effort and progression.
            </p>
            <hr />
            <div id="volume">
                <LinkedChart
                    {data}
                    grow="true"
                    showValue="true"
                    valueAppend="lbs"
                    valuePosition="floating"
                    fill="#ad0600"
                />
            </div>
        </div>
    </div>
{/if}

<style>
    .workout-summary > h2 > a {
        display: inline-block;
        text-decoration: none;
        color: white;
        width: max-content;
        font-size: 0.9em;
    }

    .workout-summary {
        padding: 10px;
        margin: 10px;
        display: block;
        width: 275px;
        max-width: 275px;
        height: 500px;
        max-height: 500px;
        overflow: auto;
        flex: auto;
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
        margin: auto;
        margin-top: 10px;
    }

    #add p {
        font-size: 200px;
        text-align: center;
        font-weight: bold;
        color: #fff;
        height: 200px;
        width: 200px;
    }

    #add {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        max-height: 400px;
        width: inherit;
    }

    #add-panel {
        overflow: hidden;
    }

    #add-panel a {
        text-decoration: none;
        color: #fff;
    }

    #graphpanel {
        max-width: 650px;
        margin: 0 auto;
        margin-top: 10px;
        max-height: 200px;
    }

    #content {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        flex-wrap: wrap;
        max-width: 1500px;
        margin: auto;
        margin-top: 10px;
    }
</style>
