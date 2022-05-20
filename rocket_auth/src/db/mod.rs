#[cfg(feature="sqlx-mysql")]
mod mysql;
#[cfg(any(feature="sqlx-sqlite"))]
mod sqlite;

use crate::prelude::*;

#[rocket::async_trait]
pub trait DBConnection: Send + Sync {
    async fn init(&self) -> Result<()>;
    async fn create_user(&self, name: &str, hash: &str, is_admin: bool) -> Result<(), Error>;
    async fn update_user(&self, user: &User) -> Result<()>;
    async fn delete_user_by_id(&self, user_id: i32) -> Result<()>;
    async fn delete_user_by_name(&self, name: &str) -> Result<()>;
    async fn get_user_by_id(&self, user_id: i32) -> Result<User>;
    async fn get_user_by_name(&self, name: &str) -> Result<User>;
}

#[rocket::async_trait]
impl<T: DBConnection> DBConnection for std::sync::Arc<T> {
    async fn init(&self) -> Result<()> {
        T::init(self).await
    }
    async fn create_user(&self, name: &str, hash: &str, is_admin: bool) -> Result<(), Error> {
        T::create_user(self, name, hash, is_admin).await
    }
    async fn update_user(&self, user: &User) -> Result<()> {
        T::update_user(self, user).await
    }
    async fn delete_user_by_id(&self, user_id: i32) -> Result<()> {
        T::delete_user_by_id(self, user_id).await
    }
    async fn delete_user_by_name(&self, name: &str) -> Result<()> {
        T::delete_user_by_name(self, name).await
    }
    async fn get_user_by_id(&self, user_id: i32) -> Result<User> {
        T::get_user_by_id(self, user_id).await
    }
    async fn get_user_by_name(&self, name: &str) -> Result<User> {
        T::get_user_by_name(self, name).await
    }
}


#[rocket::async_trait]
impl<T: DBConnection> DBConnection for tokio::sync::Mutex<T> {
    async fn init(&self) -> Result<()> {
        self.init().await
    }
    async fn create_user(&self, name: &str, hash: &str, is_admin: bool) -> Result<(), Error> {
        self.lock().await.create_user(name, hash, is_admin).await
    }
    async fn update_user(&self, user: &User) -> Result<()> {
        self.lock().await.update_user(user).await
    }
    async fn delete_user_by_id(&self, user_id: i32) -> Result<()> {
        self.lock().await.delete_user_by_id(user_id).await
    }
    async fn delete_user_by_name(&self, name: &str) -> Result<()> {
        self.lock().await.delete_user_by_name(name).await
    }
    async fn get_user_by_id(&self, user_id: i32) -> Result<User> {
        self.lock().await.get_user_by_id(user_id).await
    }
    async fn get_user_by_name(&self, name: &str) -> Result<User> {
        self.lock().await.get_user_by_name(name).await
    }
}
