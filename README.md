# WLRS [![codecov](https://codecov.io/gh/Zusier/wlrs/branch/main/graph/badge.svg?token=JQX7FH4WL5)](https://codecov.io/gh/Zusier/wlrs)

First time trying to make a "full stack" web application. Goal is to track workouts

Never taken a class on "advanced data structures" so feel free to scold me on how I should do it

## TODO

- [x] Make impl for WorkoutEntry so we can parse after retrieving from DB
- [x] Json for data stuff
- [ ] HTML + CSS Templating for workout view
- [ ] Authentication + Cookies
- [X] switch date to unix timestamp (and start/end times)
- [ ] Switch from sqlite DB once stuff is working great. (Using sqlite because my dev environment changes frequently)
- [ ] Minimize dependencies

## Design Choices/Questions
- Should I render data server or client side?
  - Most of it will probably be server side, need to research pros and cons