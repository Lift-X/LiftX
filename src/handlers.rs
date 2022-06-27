use std::path::PathBuf;
use std::path::Path;

use crate::cache::CachedFile;
#[allow(unused_imports)]
use crate::database::Db;
use rocket::{fs::NamedFile, response::Redirect};
use rocket_auth::Auth;

const BASIC_HTML: &str = "build/index.html";

#[get("/_app/<file..>")]
pub async fn get_app(file: PathBuf) -> Option<NamedFile> {
    let file: PathBuf = Path::new("build/_app").join(file);
    NamedFile::open(file).await.ok()
}

#[get("/workouts/<id>")]
pub async fn workout_view(id: String) -> Option<NamedFile> {
    debug!("Viewing {}", id);
    NamedFile::open(BASIC_HTML).await.ok()
}

#[get("/workouts/new")]
pub async fn workout_new() -> Option<NamedFile> {
    NamedFile::open(BASIC_HTML).await.ok()
}

#[get("/static/<file..>")]
pub async fn static_file(file: PathBuf) -> Option<CachedFile> {
    let file = Path::new("static").join(file);
    let cache_time: u32;
    if crate::PROD {
        cache_time = 604800; // 1 week
    } else {
        cache_time = 0;
    }
    let cache = CachedFile {
        data: NamedFile::open(file).await.ok()?,
        cache_time,
    };
    Some(cache)
}

#[get("/<file..>", rank = 2)]
pub async fn get_asset(file: PathBuf) -> Option<NamedFile> {
    let file = Path::new("build").join(file);
    NamedFile::open(file).await.ok()
}

#[get("/register")]
pub async fn register() -> Option<NamedFile> {
    NamedFile::open(BASIC_HTML).await.ok()
}

#[get("/login")]
pub async fn login() -> Option<NamedFile> {
    NamedFile::open(BASIC_HTML).await.ok()
}

#[get("/logout")]
pub fn logout(auth: Auth<'_>) -> Result<Redirect, rocket_auth::Error> {
    auth.logout()?;
    Ok(Redirect::to("/"))
}

#[get("/home")]
pub async fn home() -> Option<NamedFile> {
    NamedFile::open(BASIC_HTML).await.ok()
}

#[get("/settings")]
pub async fn settings() -> Option<NamedFile> {
    NamedFile::open(BASIC_HTML).await.ok()
}

#[get("/")]
pub async fn frontpage() -> Option<NamedFile> {
    NamedFile::open(BASIC_HTML).await.ok()
}

#[catch(404)]
pub async fn general_404() -> Option<NamedFile> {
    NamedFile::open("templates/404.html").await.ok()
}
