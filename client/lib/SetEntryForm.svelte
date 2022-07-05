<script>
    function weightUnitSync() {
        let list = document.getElementsByClassName("weightunit");
        for (let i = 0; i < list.length; i++) {
            list[i].value = weightunit.value;
        }
    }
</script>

<div class="set">
    <ul>
        <li>
            <label
                >Reps:<input
                    type="number"
                    class="reps numberform inline w-12 border-0 border-b-2 mb-1 border-primary-500 hover:border-primary-500 focus:hover:border-primary-500"
                    placeholder="Reps"
                    min="0"
                    max="100"
                    required
                /></label
            >
        </li>
        <li>
            <label
                >Weight:<input
                    type="number"
                    class="weight numberform inline w-12 border-0 border-b-2 mb-1 border-primary-500 hover:border-primary-500 focus:hover:border-primary-500"
                    placeholder="Weight"
                    min="0"
                    max="5000"
                    required
                /><select class="weightunit" on:change={weightUnitSync}
                    ><option value="lbs">Pounds</option><option value="kg"
                        >Kilograms</option
                    ></select
                ></label
            >
        </li>
        <li>
            <label
                >Reps in Reserve:<input
                    type="number"
                    class="rir numberform inline border-0 border-b-2 mb-1 border-primary-500 hover:border-primary-500 focus:hover:border-primary-500"
                    placeholder="(optional)"
                    min="0.0"
                    max="10.0"
                    steps="0.5"
                /></label
            >
        </li>
    </ul>
</div>

<style>
    li input {
        width: 10ch;
        max-width: 20ch;
        margin-left: 10px;
    }
</style>