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
            }
          });
        }
      }
    );
  }
</script>

<div id="auth-box">
  <h2>{auth_type}</h2>
  {#if error != ""}
  <div class="error-box">
      <p>{error}</p>
  </div>
  {/if}
  <div>
    <div class="user-box">
      <input type="name" name="name" bind:value="{name}" required />
      <label>Username</label>
    </div>
    <div class="user-box">
      <input type="password" name="password" bind:value="{password}" required />
      <label>Password</label>
    </div>
    <div class="submit-box">
      <input class="submit" type="submit" value={auth_type} on:click="{handleSubmit}"/>
    </div>
  </div>
</div>

<style>
  #auth-box {
    display: block;
    width: 325px;
    height: 400px;
    margin: 10px auto;
    padding: 40px;
    background: rgb(38, 38, 38);
    box-sizing: border-box;
    box-shadow: 0 15px 25px rgba(0, 0, 0, 0.6);
    border-radius: 10px;
  }

  #auth-box h2 {
    margin: 0 0 30px;
    padding: 0;
    color: #fff;
    text-align: center;
  }

  #auth-box .user-box {
    position: relative;
  }

  #auth-box .user-box input,
  #auth-box .submit-box input {
    width: 100%;
    padding: 10px 0;
    font-size: 16px;
    color: #fff;
    margin-bottom: 30px;
    border: none;
    border-bottom: 1px solid #fff;
    outline: none;
    background: transparent;
  }
  #auth-box .user-box label {
    position: absolute;
    top: 0;
    left: 0;
    padding: 10px 0;
    font-size: 16px;
    color: #fff;
    pointer-events: none;
    transition: 0.5s;
  }

  #auth-box .user-box input:focus ~ label,
  #auth-box .user-box input:valid ~ label {
    top: -20px;
    left: 0;
    color: #ad0600;
    font-size: 12px;
  }

  #auth-box .submit-box input {
    position: relative;
    display: inline-block;
    padding: 10px 20px;
    color: #ffffff;
    font-size: 16px;
    text-decoration: none;
    text-transform: uppercase;
    overflow: hidden;
    transition: 0.5s;
    margin-top: 20px;
    letter-spacing: 4px;
    border: none;
  }

  #auth-box .submit-box input:hover {
    background: #ad0600;
    color: #fff;
    border-radius: 5px;
    box-shadow: 0 0 5px #ad0600, 0 0 25px #ad0600, 0 0 50px #ad0600,
      0 0 75px #ad0600;
  }

  .error-box {
    color: #fff;
    text-align: center;
    background-color: #ad0600;
    padding: 5px;
    border-radius: 5px;
  }
</style>
