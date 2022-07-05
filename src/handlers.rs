use std::path::PathBuf;
use std::path::Path;

use crate::cache::CachedFile;
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

#[get("/workouts/<id>")]
pub async fn workout_view(id: String) -> Option<NamedFile> {
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
    let file:PathBuf = Path::new(WEB_DIR).join(file);
    NamedFile::open(file).await.ok()
}

#[get("/register")]
pub async fn register() -> Option<NamedFile> {
    let file: PathBuf = Path::new(WEB_DIR).join("register.html");
    NamedFile::open(file).await.ok()
}

#[get("/signup")]
pub async fn signup_redirect() -> Redirect {
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
pub async fn general_404() -> Option<CachedFile> {
    let file: PathBuf = Path::new(TEMPLATES_DIR).join("404.html");
    let file = NamedFile::open(file).await.ok().expect("404 Template should exist");
    Some(CachedFile::new(file, 86400).await)
}
