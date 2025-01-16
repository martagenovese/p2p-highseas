# Site for Peer Tutoring

## Overview

This project is a web application designed to facilitate peer tutoring. It allows tutees to book lessons with tutors, and administrators to manage tutors and validate lessons.

## Features

### Tutee: 
- Dashboard
    - view lessons
        - filter on: tutor class, tutor major, subject
    - book lessons
        - email sent to tutor, tutee, both parents
    - see their reserved lessons
    - delete reservation (anytime)
        - email sent to tutor, tutee, both parents, centralino, admin
- Account
    - student email
    - student's parent email (if underage)
    - telephone number (?)

### Tutor:
- Dashboard
    - give availability for a lesson (min. two days ahead in time)
        - email sent with request to admin
    - see reserved lessons
    - remove a lesson (max. one day before)
        - email sent to tutor, parent, centralino, admin, (tutee, parent)
- Account
    - student email
    - student's parent email (if underage)
    - telephone number (?)
- Settings
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


## Usage

### Tutee

1. **Login**: Tutees can log in using their credentials.
2. **View Calendar**: Tutees can view their reserved lessons on a calendar.
3. **Book Lessons**: Tutees can book lessons with available tutors.

### Admin

1. **Login**: Admins can log in using their credentials.
2. **Manage Tutors**: Admins can add new tutors and delete existing ones.
3. **Validate Lessons**: Admins can validate lessons booked by tutees.




TODO:
aggiungere argomenti a Lezioni
aggiungere nome e cognome a lezioni
cambiare la PK con la mail
autenticazione google
dividere POST DELETE