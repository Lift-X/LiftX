use rocket::response;
/// Allows for a `Cache-Control` header to be used on any response that implements `Responder`.
/// The `cache_control` field is
pub struct CacheableResponse<T> {
    pub data: T,
    pub cache_control: String,
}

impl<'r, 'o: 'r, T: response::Responder<'r, 'o>> response::Responder<'r, 'o>
    for CacheableResponse<T>
{
    fn respond_to(self, req: &'r rocket::Request<'_>) -> response::Result<'o> {
        response::Response::build_from(self.data.respond_to(req)?)
            .raw_header("Cache-Control", self.cache_control)
            .ok()
    }
}
