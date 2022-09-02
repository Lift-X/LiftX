use std::path::{Path, PathBuf};

use crate::cache::CacheableResponse;
#[allow(unused_imports)]
use crate::database::Db;
use rocket::{fs::NamedFile, response::Redirect};
use rocket_auth::Auth;

const WEB_DIR: &str = "build";
const TEMPLATES_DIR: &str = "templates";

#[get("/_app/<file..>")]
pub async fn get_app(file: PathBuf) -> Option<NamedFile> {
    let file: PathBuf = Path::new("build/_app").join(file);
    NamedFile::open(file).await.ok()
}

#[get("/workouts/<file..>")]
pub async fn workout_view(file: PathBuf) -> Option<NamedFile> {
    let file: String = file.into_os_string().into_string().unwrap();
    // temp fix for https://github.com/sveltejs/kit/issues/6326
    if file.contains("_app") {
        let file = Path::new("build/").join(file);
        return NamedFile::open(file).await.ok();
    }
    let file: PathBuf = Path::new(WEB_DIR).join("workoutview.html");
    NamedFile::open(file).await.ok()
}

#[get("/workouts/new")]
pub async fn workout_new() -> Option<NamedFile> {
    let file: PathBuf = Path::new(WEB_DIR).join("workoutnew.html");
    NamedFile::open(file).await.ok()
}

#[get("/<file..>", rank = 2)]
pub async fn get_asset(file: PathBuf) -> Option<NamedFile> {
    let file: PathBuf = Path::new(WEB_DIR).join(file);
    NamedFile::open(file).await.ok()
}

#[get("/register")]
pub async fn register() -> Option<NamedFile> {
    let file: PathBuf = Path::new(WEB_DIR).join("register.html");
    NamedFile::open(file).await.ok()
}

#[get("/signup")]
pub fn signup_redirect() -> Redirect {
    Redirect::to("/register")
}

#[get("/login")]
pub async fn login() -> Option<NamedFile> {
    let file: PathBuf = Path::new(WEB_DIR).join("login.html");
    NamedFile::open(file).await.ok()
}

#[get("/logout")]
pub fn logout(auth: Auth<'_>) -> Result<Redirect, rocket_auth::Error> {
    auth.logout()?;
    Ok(Redirect::to("/"))
}

#[get("/home")]
pub async fn home() -> Option<NamedFile> {
    let file: PathBuf = Path::new(WEB_DIR).join("home.html");
    NamedFile::open(file).await.ok()
}

#[get("/settings")]
pub async fn settings() -> Option<NamedFile> {
    let file: PathBuf = Path::new(WEB_DIR).join("settings.html");
    NamedFile::open(file).await.ok()
}

#[get("/")]
pub async fn frontpage() -> Option<NamedFile> {
    let file: PathBuf = Path::new(WEB_DIR).join("index.html");
    NamedFile::open(file).await.ok()
}

#[catch(404)]
pub async fn general_404() -> Option<CacheableResponse<NamedFile>> {
    let file: PathBuf = Path::new(TEMPLATES_DIR).join("404.html");
    let file = NamedFile::open(file).await.expect("404 Template should exist");
    Some(CacheableResponse {
        data: file,
        cache_control: "max-age=86400".to_string(),
    })
}
