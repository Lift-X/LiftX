
export function duration_from_secs(time) {
        let hours = Math.floor(time / 3600);
        let minutes = Math.floor((time - hours * 3600) / 60);
        let seconds = time - hours * 3600 - minutes * 60;
        return hours + "h " + minutes + "m " + seconds + "s";
}