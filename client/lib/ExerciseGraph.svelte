<script>
  import { Doughnut } from "svelte-chartjs";
  import { onMount } from "svelte";

  let data = {};
  let fetched = false;

  import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    CategoryScale,
  } from 'chart.js';
  ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale);
  
  onMount(async () => {
    const res = await fetch("/api/graphs/exercises");
    data = await res.json();
    fetched = true; // there should be a better way of doing this. maybe not as this library isn't written with svelte in mind
  })

</script>

{#if fetched}
<Doughnut type='doughnut' data={data} />
{/if}
