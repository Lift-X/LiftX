import { writable } from "svelte/store";
import {get} from 'svelte/store';

export const json_data = writable({
    user: "",
    uuid: "", // Will be generated server side
    title: "",
    end_time: 0,
    start_time: 0,
    exercises: [],
});

export async function get_current_user() {
    // If logged in, don't make uneeded api calls
    // Retrive json_data svelte store
    const json_data_store = get(json_data);
    if (json_data_store.user != "") {
        console.log("Skipping user lookup");
        return;
    }
    console.log("Calling user api");
    const response = await fetch("/api/user/current");
    const data = await response.json();
    if (data.error == null) {
        json_data.update((old) => { old.user = data.name; return old; });
    } else {
        json_data.update((old) => { old.user = ""; return old; });
    }
}