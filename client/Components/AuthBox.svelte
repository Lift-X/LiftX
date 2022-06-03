<script>
  // Login or Register
  export let auth_type = "";
  export let endpoint = "";
  let name = "";
  let password = "";
</script>

<div id="login-box">
  <h2>{auth_type}</h2>
  <form action={endpoint} method="post">
    <div class="user-box">
      <input type="name" name="name" required />
      <label>Username</label>
    </div>
    <div class="user-box">
      <input type="password" name="password" required />
      <label>Password</label>
    </div>
    <div class="submit-box">
      <input class="submit" type="submit" value={auth_type} />
    </div>
  </form>
</div>

<style>
  #login-box {
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

  #login-box h2 {
    margin: 0 0 30px;
    padding: 0;
    color: #fff;
    text-align: center;
  }

  #login-box .user-box {
    position: relative;
  }

  #login-box .user-box input,
  #login-box .submit-box input {
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
  #login-box .user-box label {
    position: absolute;
    top: 0;
    left: 0;
    padding: 10px 0;
    font-size: 16px;
    color: #fff;
    pointer-events: none;
    transition: 0.5s;
  }

  #login-box .user-box input:focus ~ label,
  #login-box .user-box input:valid ~ label {
    top: -20px;
    left: 0;
    color: #ad0600;
    font-size: 12px;
  }

  #login-box .submit-box input {
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

  #login-box .submit-box input:hover {
    background: #ad0600;
    color: #fff;
    border-radius: 5px;
    box-shadow: 0 0 5px #ad0600, 0 0 25px #ad0600, 0 0 50px #ad0600,
      0 0 75px #ad0600;
  }
</style>
