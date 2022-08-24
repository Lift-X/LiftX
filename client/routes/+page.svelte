<svelte:head>
	<title>LiftX - Workout Tracker</title>
</svelte:head>

<div>
	<center>
		<h1 class="title is-primary text-center font-extrabold ">LiftX</h1>
		<h4 class="subtitle mt-8">An opinionated, free and open-source Workout Tracker.</h4>
		<div class="box">
			<div>
				<h3 class="font-extrabold">Fast</h3>
				<p>
					LiftX is built with a minimalist and fast design in mind. Don't let your workout tracker
					slow you down!
				</p>
			</div>
			<div>
				<h3 class="font-extrabold">Private</h3>
				<p>
					We don't keep any data that <span class="italics">isn't</span> your workouts.
				</p>
			</div>
			<div>
				<h3 class="font-extrabold">Open Source</h3>
				<p>
					LiftX is open source and available on <a href="https://github.com/lift-x/LiftX">GitHub</a>.
				</p>
			</div>
			<div>
				<h3 class="font-extrabold">Self-Hosted</h3>
				<p>Because we are open source, you can self-host. Your workouts, your control.</p>
			</div>
		</div>
		<a class="btn bg-primary-500 hover:bg-primary-700" href="/register">Sign Up</a>
	</center>
</div>

<style>
	.title {
		font-size: 75px;
		margin: 0;
		font-weight: bold;
		padding-top: 100px;
	}

	center {
		background-image: linear-gradient(rgb(0, 0, 0, 0.75), rgba(0, 0, 0, 0.75)),
			url('/static/home_deadlift.webp');
		background-size: cover;
		background-position: center center;
		background-attachment: scroll;
		background-repeat: no-repeat;
		padding-bottom: 50px;
	}

	.box div {
		padding: 25px;
		border-radius: 10px;
		margin: 25px;
		max-width: 25ch;
		background-color: #a50b00;
	}

	.box > div > p > a {
		color: white;
	}

	.box {
		display: flex;
		flex-direction: row;
		justify-content: space-around;
	}
</style>
