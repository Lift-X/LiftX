<script>
  import { Bar } from "svelte-chartjs";
  import { onMount } from "svelte";

  let data = {};
  let fetched = false;

  import {
    Chart,
    Title,
    Tooltip,
    Legend,
    BarElement, 
    CategoryScale,
    LinearScale
  } from 'chart.js';
  Chart.register(
    Title,
    Tooltip,
    Legend,
    BarElement,
    CategoryScale,
    LinearScale
  );
  onMount(async () => {
    const res = await fetch("/api/user/exercises/list");
    data = await res.json();
    fetched = true; // there should be a better way of doing this. maybe not as this library isn't written with svelte in mind
  })

</script>

{#if fetched}
<Bar type='bar' data={data} />
{/if}
