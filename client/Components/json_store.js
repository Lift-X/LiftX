import { writable } from "svelte/store";

export const json_data = writable({
    user: "",
    uuid: "", // Will be generated server side
    title: "",
    end_time: 0,
    start_time: 0,
    exercises: [],
});

export const logged_in = writable({
    user: "",
    value: false,
    error: "",
});

export async function get_current_user() {
    const response = await fetch("/api/user/current");
    const statusText = response.statusText;
    const data = await response.json();
    if (statusText != "Unauthorized") {
        json_data.update((old) => { old.user = data.name; return old; });
    } else {
        logged_in.update((old) => { old.error = statusText; return old; });
        throw new Error(statusText);
    }
}