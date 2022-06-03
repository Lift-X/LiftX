<script>
  import Nav from "./Nav.svelte";
  import Footer from "./Footer.svelte";
  import { Router, Route } from "yrv";
  import WorkoutView from "./pages/WorkoutView.svelte";
  import WorkoutNew from "./pages/WorkoutNew.svelte";
  import Login from "./pages/Login.svelte";
  import Frontpage from "./pages/Frontpage.svelte";
  import Home from "./pages/Home.svelte";
  import Register from "./pages/Register.svelte";
</script>

<main>
  <Nav />
  <Router>
    <Route exact path="/"><Frontpage /></Route>
    <Route path="/workouts/:id" let:router
      ><WorkoutView id={router.params.id} /></Route
    >
    <Route exact path="/workouts/new"><WorkoutNew /></Route>
    <Route exact path="/register"><Register /></Route>
    <Route exact path="/login"><Login /></Route>
    <Route exact path="/home"><Home /></Route>
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

  :global(.italics) {
    font-style: italic;
  }

  :global(.separator) {
    background: #2b2b2b;
    border-radius: 33px;
    padding: 15px;
    margin: 10px;
  }

  :global(#content) {
    max-width: 1200px;
    margin: 0 auto;
  }
</style>
