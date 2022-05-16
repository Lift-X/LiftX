import { writable } from "svelte/store";

export const json_data = writable({
    user: "",
    uuid: "", // UUID of the workout entry, will be done server-side
    title: "",
    end_time: 0,
    start_time: 0,
    exercises: [],
});