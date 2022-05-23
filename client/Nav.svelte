<script>
import { onMount } from "svelte";

    import { get } from "svelte/store";
    import { get_current_user, json_data } from "./Components/json_store";
    let json_data_store = [];
    let login_status = false;
    onMount(async () => {
        await get_current_user();
        json_data_store = get(json_data);
        login_status = (json_data_store.user != "") ? true : false;
        console.log(json_data_store);
        console.log(login_status);
    });
</script>

<nav class="navbar is-primary" aria-label="main navigation">
    <div>
        <div class="navbar-brand">
            <div class="nav-logo">
                <a href="/">
                    <img src="/public/logo.png" alt="WLRS Logo" />
                </a>
            </div>
        </div>
        <div class="navbar-menu">
            <ul class="nav-links">
                <li><a class="navbar-item" href="/home">Home</a></li>
                {#if login_status}
                <li><a class="navbar-item" href="/workouts/new">New Workout</a></li>
                <li><a class="navbar-item" href="/logout">Logout</a></li>
                {:else}
                <li><a class="navbar-item" href="/login">Login</a></li>
                {/if}
            </ul>
        </div>
    </div>
</nav>

<style>
    nav {
        align-items: center;
        background-color: #a50b00;
        display: block;
        margin: 0;
        padding: 0;
    }

    nav > div {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .nav-logo > a > img {
        max-height: 90px;
    }

    .nav-links {
        display: flex;
        justify-content: space-between;
    }

    .nav-links li {
        list-style: none;
    }

    .nav-links a {
        color: white;
        text-decoration: none;
        letter-spacing: 3px;
        font-weight: bold;
        font-size: 14px;
        padding: 14px 16px;
    }

    .nav-links a:hover {
        background-color: #b44038;
        color: #fff;
    }
</style>
