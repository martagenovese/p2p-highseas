# Site for Peer Tutoring

## Overview

This project is a web application designed to facilitate peer tutoring. 
It allows tutees to book lessons with tutors, and administrators to manage tutors and validate lessons.

**notice:** this application is actually used in my school and hosted on my school's server and domain, which means that only members of my school's organization will be able to access it. Do not worry tho, i filmed a demo ;)

## Features

### Login:
the login is implemented with google OAuth and kept in store with flask session

### Tutee: 
- Dashboard:
    - see their reserved lessons in a calendar
parents
    - delete reservation (anytime)
        - email sent to tutor, tutee, both parents (if underage), centralino, admin
- Reserve a lesson:
    - view lessons
        - filter on: tutor class, tutor major, subject
    - book lessons
        - email sent to tutor, tutee --> if they are underage the mail is sent also to the 

### Tutor:
- Dashboard
    - give availability for a lesson (min. two days ahead in time)
        - email sent with request to admin
    - see reserved lessons
    - remove a lesson (max. one day before)
        - email sent to tutor, parent if underage, centralino, admin, (tutee if it was reserved, parent if underage)
- Profile
    - Add/Remove availability for subjects
- Other
    - max 40 lessons per year

### Admin
- Dashboard
    - manage tutors (add/delete)
    - validate lessons.

### Centralino
- Dashboard
    - associate peers to a room



### Technologies Used

- **Backend**: Flask (Python)
- **Frontend**: HTML, CSS, JavaScript
- **Database**: MySQL
- **Calendar**: FullCalendar.js

