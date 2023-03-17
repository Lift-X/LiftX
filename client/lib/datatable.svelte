<script lang="ts">
  import { writable } from 'svelte/store'
  import {
    ColumnDef,
    createSvelteTable,
    flexRender,
    getCoreRowModel,
    TableOptions,
  } from '@tanstack/svelte-table'
  type Workout = {
    id: string
    name: string
    duration: number
    exercises: number
    hp_set: string // highest performance set, highest weight and reps
    intelilift_score: number
  }
  const defaultData: Workout[] = [
    {
      id: 'ff154ed8-984d-421e-be98-72aa5c491306',
      name: 'Push Day',
      duration: 60,
      exercises: 3,
      hp_set: '225x10',
      intelilift_score: 1231,
    },
    {
      id: 'aoidjosaidj',
      name: 'asoidoaduh',
      duration: 30,
      exercises: 5,
      hp_set: '135x90',
      intelilift_score: 2000
    }
  ]
  const defaultColumns: ColumnDef<Workout>[] = [
    {
      accessorKey: 'id',
      cell: info => info.getValue(),
      footer: info => info.column.id,
    },
    {
      accessorKey: 'name',
      cell: info => info.getValue(),
      header: () => 'Name',
      footer: info => info.column.id,
    },
    {
      accessorKey: 'duration',
      header: () => 'Duration',
      footer: info => info.column.id,
    },
    {
      accessorKey: 'exercises',
      header: () => 'Exercises',
      footer: info => info.column.id,
    },
    {
      accessorKey: 'hp_set',
      header: 'Top Perf. Set',
      footer: info => info.column.id,
    },
    {
      accessorKey: 'intelilift_score',
      header: 'Intelilift Score',
      footer: info => info.column.id,
    },
  ]
  const options = writable<TableOptions<Workout>>({
    data: defaultData,
    columns: defaultColumns,
    getCoreRowModel: getCoreRowModel(),
  })
  const table = createSvelteTable(options)
</script>

<style>
table {
  margin: auto;
  /* border: 8px solid #2b2b2b; */
  background-color: #2b2b2b;
  padding: 15px;
  border-radius: 10px;
  color: white;
  display: block;
  min-width: fit-content;
  max-width: max-content;
}

thead {
  background-color: #3f3f3f;
  border-radius: 10px;
}

tbody {
  /* border-bottom: 1px solid lightgray; */
}

th {
  /* border-bottom: 1px solid lightgray; */
  /* border-right: 1px solid lightgray; */
  padding: 2px 4px;
}

tfoot {
  /* color: gray; */
}

/* tfoot th { */
/*   font-weight: normal; */
/* } */

td {
  padding-top: 0.25em;
  padding-bottom: 0.25em;
  padding-left: 0.25em;
  padding-right: 0.25em;
  border-left: 2px solid #3f3f3f;
  border-right: 2px solid #3f3f3f;
  border-bottom: 2px solid #3f3f3f;
  color: white;
}
</style>

<div class="p-2">
  <table>
    <thead>
      {#each $table.getHeaderGroups() as headerGroup}
        <tr>
          {#each headerGroup.headers as header}
            <th>
              {#if !header.isPlaceholder}
                <svelte:component
                  this={flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                />
              {/if}
            </th>
          {/each}
        </tr>
      {/each}
    </thead>
    <tbody>
      {#each $table.getRowModel().rows as row}
        <tr>
          {#each row.getVisibleCells() as cell}
            <td>
              <svelte:component
                this={flexRender(cell.column.columnDef.cell, cell.getContext())}
              />
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
    <tfoot>
      <!-- {#each $table.getFooterGroups() as footerGroup} -->
      <!--   <tr> -->
      <!--     {#each footerGroup.headers as header} -->
      <!--       <th> -->
      <!--         {#if !header.isPlaceholder} -->
      <!--           <svelte:component -->
      <!--             this={flexRender( -->
      <!--               header.column.columnDef.footer, -->
      <!--               header.getContext() -->
      <!--             )} -->
      <!--           /> -->
      <!--         {/if} -->
      <!--       </th> -->
      <!--     {/each} -->
      <!--   </tr> -->
      <!-- {/each} -->
    </tfoot>
  </table>
  <div class="h-4" />
</div>
