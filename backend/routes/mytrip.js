"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureAdmin, ensureCorrectUserOrAdmin } = require("../middleware/auth");
const Trip = require("../models/trip");

// const companyNewSchema = require("../schemas/companyNew.json");
// const companyUpdateSchema = require("../schemas/companyUpdate.json");
// const companySearchSchema = require("../schemas/companySearch.json");

const router = new express.Router();

router.post("/", ensureAdmin, async function (req, res, next) {
    try {
    //CREATING and EMPTY TRIP for USER
    const { trip_name, trip_date, username, flightReservation_id, hotelReservation_id, carRental_id } = req.body;
    
    const newTrip = await Trip.create({
      trip_name,
      trip_date,
      username, 
      flightReservation_id,
      hotelReservation_id, 
      carRental_id
     });
   
    // const { dataValues } = newTrip;
    res.send(newTrip);
      // const validator = jsonschema.validate(req.body);
    //   const validator = jsonschema.validate(req.body, companyNewSchema);
      // if (!validator.valid) {
      //   const errs = validator.errors.map(e => e.stack);
      //   throw new BadRequestError(errs);
      // }
  
      // const trip = await Trip.create(req.body);
      // return res.status(201).json({ trip }); 
      return res.status(201).json({ newTrip });
    } catch (err) {
      return next(err);
    }
  });


  router.get("/", async function (req, res, next) {
    //GET all the TRIPS of the user using USER_ID that is in the token
    // const q = req.query;
    // arrive as strings from querystring, but we want as int/bool
    // if (q.type !== undefined) q.type = +q.type;
    // q.class_type = q.class_type=== "true";
  
    try {
    //   const validator = jsonschema.validate(q);
    // //   const validator = jsonschema.validate(q, jobSearchSchema);
    //   if (!validator.valid) {
    //     const errs = validator.errors.map(e => e.stack);
    //     throw new BadRequestError(errs);
    //   }
      // const trips = await Trip.findAll(q);
       const trips = await Trip.findAll();
        // res.send(trips);
      return res.json({ trips });
    } catch (err) {
      return next(err);
    }
  });

  // router.get("/trip/:id", async function (req, res, next) {
    router.get("/:id", async function (req, res, next) {
    try {
     //Check if the trip's user_id is the same as user_id in the token
     //the trip info (which includes all of the related objects so use JSON here)
      const trip = await Trip.get(req.params.id);
      return res.json({ trip });
    } catch (err) {
      return next(err);
    }
  });

  // router.patch("/trip/:id", ensureCorrectUserOrAdmin, async function (req, res, next) {
    router.patch("/:id",  ensureCorrectUserOrAdmin, async function (req, res, next) {
    try {
    //CHANGE the NAME OF the TRIP
   //CHANGE the DATE
   const { trip_name, trip_date } = req.body;
   const updatedTrip = await Trip.update(req.params.id, 
    {
      trip_name,
      trip_date,
   });

  //  const { tripName, tripDate } = req.body;
  //  const updatedTrip = await Trip.update(req.params.id, {
  //    tripName,
  //    tripDate,
  //  });

   res.send(updatedTrip);
   
    //   const validator = jsonschema.validate(req.body);
    // //   const validator = jsonschema.validate(req.body, jobUpdateSchema)
    //   if (!validator.valid) {
    //     const errs = validator.errors.map(e => e.stack);
    //     throw new BadRequestError(errs);
    //   }
  
      // const trip = await Trip.update(req.params.id, req.body);
      // return res.json({ trip });
      return res.json({ updatedTrip });
    } catch (err) {
      return next(err);
    }
  });


  // router.delete("/trip/:id", ensureCorrectUserOrAdmin, async function (req, res, next) {
    router.delete("/:id", ensureCorrectUserOrAdmin, async function (req, res, next) {
    try {
      // const { id } = req.params;
      // const deletedTrip = await Trip.remove({
      //  where: {
      //    id
      //     }
      // })
      // res.send(deletedTrip);
      await Trip.remove(req.params.id);
      // return res.json({ deleted: req.params.id });
      return res.json({ deleted: deletedTrip });
    } catch (err) {
      return next(err);
    }
  });
  
  
  /** POST /[username]/flights/[id]  { state } => { trip }
   * Returns {"added": flightId}
   * Authorization required: admin or same-user-as-:username
   * */
  
  // router.post("/trip/:tripId/flights/:flightId", ensureCorrectUserOrAdmin, async function (req, res, next) {
    router.post("/:id/flights/:flightId", ensureCorrectUserOrAdmin, async function (req, res, next) {
    try {
      // const tripId = +req.params.id;
      const flightId = +req.params.id;
      await Trip.addingFlight(req.params.id, req.username, flightId);
      return res.json({ added: flightId });
    } catch (err) {
      return next(err);
    }
  });
  
  //  router.delete("/trip/:tripId/flights/:flightId", ensureCorrectUserOrAdmin, async function (req, res, next) {
    router.delete("/:id/flights/:flightId", ensureCorrectUserOrAdmin, async function (req, res, next) {
    try {
      // const tripId = req.params.id;
      const flightId = req.params.id;
      await Trip.removeFlight(req.params.id, req.username, flightId);
      return res.json({ remove: flightId });
    } catch (err) {
      return next(err);
    }
  });
  
  // HOTEL
  router.post("/:id/hotels/:hotelId", ensureCorrectUserOrAdmin, async function (req, res, next) {
    try {
      // const tripId = +req.params.id;
      const hotelId = +req.params.id;
      await Trip.addingHotel(req.params.id, req.username, hotelId);
      return res.json({ added: hotelId });
    } catch (err) {
      return next(err);
    }
  });
  
  router.delete("/:id/hotels/:hotelId", ensureCorrectUserOrAdmin, async function (req, res, next) {
    try {
      // const tripId = req.params.id;
      const hotelId = req.params.id;
      await Trip.removeHotel(req.params.id, req.username, hotelId);
      return res.json({ remove: hotelId });
    } catch (err) {
      return next(err);
    }
  });
  
//   CAR
  router.post("/:id/cars/:carId", ensureCorrectUserOrAdmin, async function (req, res, next) {
    try {
      // const tripId = +req.params.id;
      const carId = +req.params.id;
      await Trip.addingCar(req.params.id, req.username, carId);
      return res.json({ added: carId });
    } catch (err) {
      return next(err);
    }
  });
  
  router.delete("/:id/cars/:carId", ensureCorrectUserOrAdmin, async function (req, res, next) {
    try {
      // const tripId = req.params.id;
      const carId = req.params.id;
      await Trip.removeCar(req.params.id, req.username, carId);
      return res.json({ remove: carId });
    } catch (err) {
      return next(err);
    }
  });

  module.exports = router;