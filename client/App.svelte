<script>
	// export let name;
	import Nav from './Nav.svelte';
	import Footer from './Footer.svelte';
	import {Router, Route} from 'yrv';
	import Home from './pages/Home.svelte';
	import About from './pages/About.svelte';
	import Common from './pages/Common.svelte';
	import Catcher from './pages/Catcher.svelte';
	import WorkoutView from './pages/WorkoutView.svelte';
</script>

<main>
  <Nav></Nav>
  <Router>
    <Route exact path="/"><Home></Home></Route>
    <Route path="#about"><About></About></Route>
	<Route path="#app/common" let:router><Common></Common></Route>
	<Route path="#:name" let:router><Catcher></Catcher></Route>
	<Route exact path="#bruh"><WorkoutView></WorkoutView></Route>
  </Router>
  <Footer></Footer>
</main>

<style>
	:global(body) {
        background: #111;
        color: white;
        max-width: 100%;
        margin: auto;
        font-family: "Roboto", sans-serif;
    }
</style>