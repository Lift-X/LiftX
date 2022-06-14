<script>
  import { onMount } from "svelte";

  import { get } from "svelte/store";
  import { get_current_user, json_data } from "./Components/json_store";
  let json_data_store = [];
  let login_status = false;
  onMount(async () => {
    await get_current_user();
    json_data_store = get(json_data);
    login_status = json_data_store.user != "" ? true : false;
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
          <li>
            <a class="navbar-item" href="/workouts/new">New Workout</a>
          </li>
        {/if}
        <!-- User svg with dropdown-->
        <li>
          <div class="dropdown">
            <button class="dropbtn">
              <svg
                height="20px"
                width="20px"
                version="1.1"
                id="Layer_1"
                xmlns="http://www.w3.org/2000/svg"
                xmlns:xlink="http://www.w3.org/1999/xlink"
                x="0px"
                y="0px"
                viewBox="0 0 24 24"
                style="enable-background:new 0 0 24 24;"
                xml:space="preserve"
              >
                <style type="text/css">
                  .st0 {
                    fill: none;
                  }
                  .st1 {
                    fill: #ffffff;
                  }
                </style>
                <path class="st0" d="M0,0h24v24H0V0z" />
                <path
                  class="st1"
                  d="M12,12c3.3,0,6-2.7,6-6s-2.7-6-6-6S6,2.7,6,6S8.7,12,12,12z M12,15c-4,0-12,2-12,6v3h24v-3C24,17,16,15,12,15z"
                />
              </svg>
            </button>
            <div class="dropdown-content">
              {#if login_status}
              <a href="/settings">Settings</a>
              <a href="/logout">Logout</a>
              {:else}
                <a href="/login">Login</a>
                <a href="/register">Register</a>
            {/if}
            </div>
          </div>
        </li>
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
    align-items: center;
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

  /* Dropdown button */
  .dropdown .dropbtn {
    font-size: 16px;
    border: none;
    outline: none;
    color: white;
    padding: 14px 16px;
    background-color: inherit;
    font-family: inherit;
    margin: 0;
  }

  .navbar a:hover,
  .dropdown:hover .dropbtn {
    background-color: red;
  }

  .dropdown-content {
    display: none;
    position: absolute;
    background-color: #2b2b2b;
    min-width: 100px;
    right: 0;
  }

  .dropdown-content a {
    float: none;
    color: white;
    padding: 12px 16px;
    text-decoration: none;
    display: block;
    text-align: left;
  }

  .dropdown:hover .dropdown-content {
    display: block;
  }
</style>
