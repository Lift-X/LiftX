use crate::prelude::{Result, *};

use skytable::{
    actions::Actions,
    ddl::{Ddl, Keymap, KeymapType},
    types::{FromSkyhashBytes, IntoSkyhashBytes},
    Element, SkyResult,
};

#[derive(Serialize, Deserialize, PartialEq, Eq, Clone, Hash, PartialOrd, Ord)]
struct UserDB {
    name: String,
    hash: String,
    is_admin: bool,
}

impl UserDB {
    fn into_user(self) -> User {
        User {
            name: self.name,
            is_admin: self.is_admin,
            id: 1, // IDs have not been implemented yet, return 0.
            password: self.hash
        }
    }
}

impl IntoSkyhashBytes for UserDB {
    fn as_bytes(&self) -> Vec<u8> {
        serde_json::to_string(self).unwrap().into_bytes()
    }
}
impl FromSkyhashBytes for UserDB {
    fn from_element(e: Element) -> SkyResult<Self> {
        // we want our JSON as a string
        let element: String = e.try_element_into()?;
        // now let us convert it into our struct
        match serde_json::from_str(&element) {
            // good, we got it
            Ok(v) => Ok(v),
            // nah, something bad happened. We'll turn the error into a string
            // and return it
            Err(e) => Err(skytable::error::Error::ParseError(e.to_string())),
        }
    }
}

#[rocket::async_trait]
impl DBConnection for skytable::pool::Pool {
    async fn init(&self) -> Result<()> {
        let table = Keymap::new("default:auth")
            .set_ktype(KeymapType::Str)
            .set_vtype(KeymapType::Binstr);
        let result = self.get().unwrap().create_table(table);
        Ok(())
    }
    async fn create_user(&self, email: &str, hash: &str, is_admin: bool) -> Result<()> {
        self.get().unwrap().switch("default:auth").unwrap();
        let user = UserDB {
            name: email.to_string(),
            hash: hash.to_string(),
            is_admin,
        };
        let result = self.get().unwrap().set(email, user);
        Ok(())
    }
    async fn update_user(&self, user: &User) -> Result<()> {
        self.get().unwrap().switch("default:auth").unwrap();
        let user = UserDB {
            name: user.name.to_string(),
            hash: user.password.to_string(),
            is_admin: user.is_admin,
        };
        let result = self.get().unwrap().update(user.name.clone(), user);
        Ok(())
    }
    async fn delete_user_by_id(&self, user_id: i32) -> Result<()> {
        unimplemented!();
        Ok(())
    }
    async fn delete_user_by_name(&self, name: &str) -> Result<()> {
        self.get().unwrap().switch("default:auth").unwrap();
        let result = self.get().unwrap().del(name);
        Ok(())
    }
    async fn get_user_by_id(&self, user_id: i32) -> Result<User> {
        unimplemented!();
    }
    async fn get_user_by_name(&self, name: &str) -> Result<User> {
        let user: SkyResult<UserDB> = self.get().unwrap().get(name);
        match user {
            Ok(user) => Ok(user.into_user()),
            Err(_) => Err(crate::error::Error::NameDoesNotExist(name.to_string())),
        }
    }
}
