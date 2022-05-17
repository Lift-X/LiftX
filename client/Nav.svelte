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
                <li><a class="navbar-item" href="/">Home</a></li>
                <li><a class="navbar-item" href="#about">Svelte</a></li>
                <li><a class="navbar-item" href="#app/common">Common</a></li>
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
