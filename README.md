# Capstone Project 2 - Vacation Time
### *Try the app [Vacation Time - not yet](https://blabla.herokuapp.com/)*
Ready for travel, let’s make the trip of your dreams. This website `Vacation Time` allows you to find the nice hotel, flight for you with the best price. When your make next travel destination then can do a record personalized notes for vacation planning after create an account.
 You can conveniently save your results along with any notes you've made in your personalized list.
This website allows users to create an account and save the result after that with create a list of their favorites. 

## App Information
## Back-end

cd into the "backend" directory, install required packages, create and seed database, and start the server. (Make sure that you have postgreSQL installed)
  ```sh
  cd backend  
  npm install  
  createdb vacation
  psql < vacation.sql  
  nodemon server.js or node server.js
  ```  
  This will start the server on port 3001
  
### Data
For this CP database that takes trip-related information from the [Priceline API](https://rapidapi.com/tipsters/api/priceline-com-provider/)

```sh
DB schema: 
  ├── trips table (favorite flights/hotels) 
  │   └── users table
  │                 
  ├── flightReservations table
  └── hotelReservations table
 ```

<img width="1112" alt="Screen Shot 2022-09-13 at 10 41 47 PM" src="https://user-images.githubusercontent.com/75818489/190046636-681a9b5d-8626-465b-afbc-14ee0032dd5a.png">


## [Front-end](https://github.com/ElenkaSan/Capstone_Project_2_Frontend.git)

cd into the "frontend" directory, install required packages, then start the app 
  ```sh
  cd frontend    
  npm install    
  npm start
  ```
  This will run your app on http://localhost:3000
  
### Routes
|Path                 | Component         |  
|---------------------|-------------------|
| /                   | Homepage          |  
| /signup             | SignupForm        |   
| /login              | LoginForm         |  
| /hotels   	        | HotelsList        |
| /hotels/:handle     | HotelDetail       |
| /flights            | FlightsList       |
| /flights/:handle    | FlightDetail      |
| /profile            | ProfileForm       |
| /mytrip             | UserAccount       |

## Component Architecture
```sh
App
api
├── Routes-nav
│   ├── Navigation
│   └── Routes
│ 
├── Hotels
│   ├── HotelsCard
│   ├── HotelsList ── Search
│   └── HotelDetail 
│   
├── Flights
│   ├── FlightsCard
│   ├── FlightsList ── Search
│   └── FlightDetail 
│ 
├── Carsrental
│   ├── CarsrentalCard
│   ├── CarsrentalList ── Search
│   └── CarrentalDetail 
│ 
├── Homepage ── NoLoggedIn
│ 
├─┬ Auth
│ │ ├── LoginForm
│ │ ├── SignupForm
│ │ └── ProfileForm ── UserAccount (myTrip)
│ └── UserContext
│ 
├── Common
│   ├── LoadingSpinner 
│   ├── SearchForm
│   └── Alert
│ 
└── Hooks
    ├── useLocalStorage
    ├── useTimedMessage
    └── useToggle
```

### Functionality
The app's functionality includes:
  - User can search trip for every place on Earth
  - User can save favorite place results into thier favorites list after signup
  - User can record ideas and ruminations about the venue in your own personal note

### Technology Stack
- Front-End: HTML5 | CSS3 | JavaScript | React | React Bootstrap | Redux | RTL | JSON Schema | JSON Web Token
- Back-End: Node.js | Express.js | SuperTest | JWT Authentication | Bcrypt | PostgreSQL | Axios | RESTful API Endpoints | MongoDB 

### Hosting
Heroku

### Future-Features
  - The travel time feature:
    - Automatically calculate the flights and hotel date to count down in account, analyze hotel and flight costs
    - Book flight and hotel
    - When you search for any destination in the world, you will get recommendations for nice venues and places to visit in the area and detailed information about those places including pictures and maps.
    - Create app on the phone

*Stretch goals:*
  - Share favorite recipes lists with other users on the site. Good for family members, that they can add this list to their account.

Feel free to improve or contribute. Pull requests are always welcome!
Author [Elena Nurullina](https://github.com/ElenkaSan/)
