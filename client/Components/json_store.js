import { writable } from "svelte/store";

export const json_data = writable({
    user: "",
    uuid: "", // UUID of the exercise, will be done server-side
    end_time: 0,
    start_time: 0,
    exercises: [],
});