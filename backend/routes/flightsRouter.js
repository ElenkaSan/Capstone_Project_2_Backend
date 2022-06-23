const e = require('express');
const express = require('express');


const flightsBL = require('../models/flights');
const router = express.Router();


router.route('/flights')
    .get(async function(req,resp)
    {
        let data = req.query
        result = await flightsBL.getDataFlights(data); 
          return resp.json(result)
           
    })

router.route('/orderflight')
    .get(async function(req,resp)
    {
        let data = req.query
        console.log("2")
        result = await flightsBL.orderFlight(data);
        return resp.json(result)
    })

router.route('/getFullDetailsByEmail/:email')
    .get(async function(req,resp)
    {
        
        let email = req.params.email
        let User = await hotelsBL.getDataUserByEmail(email)
        return resp.json(User[0])
    })

    router.route('/saveorder')
    .post(async function(req,resp)
    {
        let data = req.body
        console.log(data)
        result = await hotelsBL.saveDataInDb(data);
        return resp.json(result)
    })


    router.route('/createUser')
    .post(async function(req,resp)
    {
      let data = req.body
      let UserExist = await hotelsBL.getDataUserByEmail(data.email)
      if(UserExist.length == 0){
        result = await hotelsBL.saveUserInDb(data);
        return resp.json(result)
      }
      else{
        return resp.json("user email already exist")
      }
    })

    router.route('/getOrdersByEmail/:email')
    .get(async function(req,resp){
       OrdersByUser = await hotelsBL.checkHotelsByUser(req.params);
      if(OrdersByUser.length > 0){
        return resp.json(OrdersByUser)
      }
    })


    router.route('/UserExistInDb')
    .post(async function(req,resp)
    {
        let data = req.body
        resultUser = await hotelsBL.checkExistingUser(data);
        if(resultUser.length > 0){
          console.log(resultUser)
            resultHotels = await hotelsBL.checkHotelsByUser(resultUser[0]);
            console.log(resultHotels)
              if(resultHotels.length > 0){
                return resp.json(resultHotels)
              }
              else{
                return resp.json("not existing orders for this user")
              }
            }
            else{
            return resp.json("user not exist")
            }
    })


    module.exports = router;