<script>
  import Nav from "./Nav.svelte";
  import Footer from "./Footer.svelte";
  import { Router, Route } from "yrv";
  import Home from "./pages/Home.svelte";
  import WorkoutView from "./pages/WorkoutView.svelte";
  import WorkoutNew from "./pages/WorkoutNew.svelte";
</script>

<main>
  <Nav />
  <Router>
    <Route exact path="/"><Home /></Route>
    <Route path="/workouts/:id" let:router><WorkoutView id={router.params.id} /></Route>
    <Route exact path="/workouts/new"><WorkoutNew /></Route>
  </Router>
  <Footer />
</main>

<style>
  :global(body) {
    background: #111;
    color: white;
    max-width: 100%;
    margin: auto;
    font-family: "Roboto", sans-serif;
  }

  :global(.hidden) {
    display: none;
  }

  :global(.center) {
    text-align: center;
  }
</style>
