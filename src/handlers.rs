use crate::cache::CachedFile;
#[allow(unused_imports)]
use crate::database::Db;
use rocket::{fs::NamedFile, response::Redirect};
use rocket_auth::Auth;

#[get("/workouts/<id>")]
pub async fn workout_view(id: String) -> Option<NamedFile> {
    debug!("Viewing {}", id);
    NamedFile::open("templates/basic.html").await.ok()
}

#[get("/workouts/new")]
pub async fn workout_new() -> Option<NamedFile> {
    NamedFile::open("templates/basic.html").await.ok()
}

#[get("/public/<file..>")]
pub async fn static_file(file: std::path::PathBuf) -> Option<CachedFile> {
    let file = std::path::Path::new("public").join(file);
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

#[get("/register")]
pub async fn register() -> Option<NamedFile> {
    NamedFile::open("templates/basic.html").await.ok()
}

#[get("/login")]
pub async fn login() -> Option<NamedFile> {
    NamedFile::open("templates/basic.html").await.ok()
}

#[get("/logout")]
pub fn logout(auth: Auth<'_>) -> Result<Redirect, rocket_auth::Error> {
    auth.logout()?;
    Ok(Redirect::to("/"))
}

#[get("/home")]
pub async fn home() -> Option<NamedFile> {
    NamedFile::open("templates/basic.html").await.ok()
}

#[get("/")]
pub async fn frontpage() -> Option<NamedFile> {
    NamedFile::open("templates/basic.html").await.ok()
}

#[catch(404)]
pub async fn general_404() -> Option<NamedFile> {
    NamedFile::open("templates/404.html").await.ok()
}
