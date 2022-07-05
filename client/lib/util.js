export function get_iso8601() {
    // 2022-07-04 12:00
    function pad(n) {return n<10 ? '0'+n : n}
    let d = new Date();
    return d.getUTCFullYear()+'-'
         + pad(d.getUTCMonth()+1)+'-'
         + pad(d.getUTCDate())+' '
         + pad(d.getUTCHours())+':'
         + pad(d.getUTCMinutes())
}