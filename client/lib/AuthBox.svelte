<script>
    // Login or Register
    export let auth_type = "";
    export let endpoint = "";
    let name = "";
    let password = "";
    let error = "";

    function handleSubmit() {
      // Post to {endpoint}
      fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: "name=" + name + "&password=" + password
      }).then(
        response => {
          // If authentication was successful, redirect to the home page
          if (response.redirected === true) {
            window.location.href = response.url;
            error = "";
          } else {
            response.json().then(data => {
              if (data.status == "error") {
                error = data.message;
              } else if (data.error != null) {
                error = data.error;
              }
            });
          }
        }
      );
    }
  </script>

  <div class="card w-96 m-auto mt-5">
    <div class="card-body items-center text-center">
      <h2 class="card-title">{auth_type}</h2>
      <div class="form-control w-full max-w-xs">
        <label class="label">
          <span class="label-text">Username</span>
        </label>
        <input type="name" name="name" bind:value="{name}" placeholder="Enter your username" class="input input-bordered focus:outline-primary border-primary w-full max-w-xs bg-black-400 text-white" />
        <label class="label">
          <span class="label-text">Password</span>
        </label>
        <input type="password" name="password" bind:value="{password}" placeholder="Enter your password" class="input input-bordered focus:outline-primary border-primary w-full max-w-xs bg-black-400 text-white" />
        <input class="submit btn btn-outline text-white hover:bg-primary-500 max-w-20 mt-5" type="submit" value={auth_type} on:click="{handleSubmit}"/>
      </div>
    </div>
  </div>

  <style>
    .card {
      background: #262626;
    }

    .label span {
      color: white;
    }
  </style>
