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
    <li><input type="number" id="reps" class="numberform" placeholder="Reps" min=0 max=100 required/></li>
    <li><input type="number" id="weight" class="numberform" placeholder="Weight" min=0 max=5000 required/><select class="weightunit"><option value="lbs" text="Pounds">lbs</option><option value="kg" text="Kilograms">kg</option></select></li>
    <li><input type="number" id="rir" class="numberform" placeholder="Reps in Reserve (optional)" min=0 max=10.0 steps=0.5/></li>
    </ul>
</div>