import { writable } from "svelte/store";

export const json_data = writable({
    user: "",
    uuid: "", // Will be generated server side
    title: "",
    end_time: 0,
    start_time: 0,
    exercises: [],
});