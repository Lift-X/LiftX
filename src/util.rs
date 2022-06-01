pub fn string_capital_case(word: &str) -> String {
    let mut capitalized: String = String::new();
    for (i, c) in word.chars().enumerate() {
        if i == 0 {
            capitalized.push(c.to_ascii_uppercase());
        } else {
            capitalized.push(c);
        }
    }
    capitalized
}
