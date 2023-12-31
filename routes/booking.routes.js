const express = require("express");
const { UserModel } = require("../models/user.model");
const BookingRouter = express.Router();
const { BookingModel } = require("../models/booking.model");
const { NotificationModel } = require("../models/notification.model");
const { MeetingModel } = require("../models/meeting.model");
const { authMiddleWare } = require("../middlewares/jwt.middleware");
const { checkRole } = require("../routes/user.routes");
const moment = require("moment");
const { sendEmail } = require("../helper");
BookingRouter.get("/", async (req, res) => {
  try {
    let data = await BookingModel.find().populate("trainer client", "name");
    res.send({ data, ok: true });
  } catch (error) {
    console.log(error);
    res.send({ error: error.message, ok: false });
  }
});
BookingRouter.post("/book", authMiddleWare, async (req, res) => {
  const { trainerId, startTime, endTime } = req.body;
  try {
    // Check if trainer and client exist in the database
    const trainer = await UserModel.findById(trainerId);
    if (!trainer) {
      return res
        .status(400)
        .json({ message: "Invalid trainer or client ID", ok: false });
    }
    // Create the booking
    const booking = new BookingModel({
      trainer: trainerId,
      client: req.user.id,
      start_time: new Date(startTime),
      end_time: new Date(endTime),
    });
    // Save the booking to the database
    await booking.save();
    await sendEmail(
      trainer.email,
      `A Request has been sent to you at ${new Date()}. Please check your DashBoard`
    );
    return res
      .status(201)
      .json({ message: "Booking request sent successfully", ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message, ok: false });
  }
});
// {
//   "trainerId":"6455cdf70851601e639bba63",
//   "startTime":"2025-06-01T10:00:00.000Z",
//   "endTime":"2025-06-01T19:00:00.000Z"
// }

// Retrieve all booking requests for a specific trainer
BookingRouter.get("/requests/:status", authMiddleWare, async (req, res) => {
  try {
    // Get the logged-in trainer's ID
    const trainerId = req.user.id;
    // Find all booking requests for the logged-in trainer from the database
    const bookings = await BookingModel.find({
      trainer: trainerId,
      status: req.params.status,
    }).populate("client", "name email");
    res.json({ ok: true, bookings });
  } catch (err) {
    res
      .status(500)
      .send({ error: err.message, mssg: "Server Error", ok: false });
  }
});

// Retrieve all booking requests for a specific client
BookingRouter.get("/requests", authMiddleWare, async (req, res) => {
  try {
    // Get the logged-in client's ID
    const clientId = req.user.id;
    // Find all booking requests for the logged-in trainer from the database
    const bookings = await BookingModel.find({ client: clientId }).populate(
      "trainer",
      "name email"
    );
    res.json({ ok: true, bookings });
  } catch (err) {
    res
      .status(500)
      .send({ error: err.message, mssg: "Server Error", ok: false });
  }
});

// Route to accept or reject a booking request
BookingRouter.post("/requests/:bookingid", authMiddleWare, async (req, res) => {
  try {
    const { bookingid } = req.params;
    const { status, Notification } = req.body;
    // Check if the trainer is authorized to accept or reject the booking request
    const booking = await BookingModel.findOne({ _id: bookingid });
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    if (!booking.trainer.equals(req.user._id)) {
      return res.status(401).json({ error: "Not authorized" });
    }
    // Update the booking status
    booking.status = status;
    await booking.save();
    // Send a notification to the user
    const notification = new NotificationModel({
      to: booking.client,
      from: req.user._id,
      booking: booking._id,
      message: Notification,
    });
    await notification.save();
    res.json({
      ok: true,
      msg: "Booking updated and notification sent succcessfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, msg: err.message });
  }
});
BookingRouter.post(
  "/:bookingId/notifications",
  authMiddleWare,
  async (req, res) => {
    try {
      const { message } = req.body;
      const { bookingId } = req.params;
      const { id: from } = req.user;

      // Find the booking and make sure the logged in user is the associated trainer
      const booking = await BookingModel.findOne({
        _id: bookingId,
        trainer: from,
      });
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      // Create the notification and save it to the database
      const notification = new NotificationModel({
        from,
        to: booking.client,
        booking: booking._id,
        message,
      });
      await notification.save();
      res.json({ ok: true, notification });
    } catch (err) {
      console.error(err);
      res.status(500).json({ ok: false, msg: err.message });
    }
  }
);

// GET /notifications
BookingRouter.get("/notifications", authMiddleWare, async (req, res) => {
  try {
    // Find all notifications sent to the user
    const notifications = await NotificationModel.find({ to: req.user.id })
      .populate("from")
      .populate("booking");
    const messages = notifications.map((notification) => notification.message);
    res.json({ ok: true, messages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, msg: error.message });
  }
});

BookingRouter.post("/meeting/create", async (req, res) => {
  try {
    const { msg, trainer, link, name } = req.body;
    const data = await MeetingModel.findOne({ trainer });
    const obj = {
      msg,
      link,
      name,
    };
    // console.log(data);
    if (!data) {
      var newData = new MeetingModel({
        trainer,
        meetings: [],
      });
      newData.meetings.push(obj);
      await newData.save();
    } else {
      data.meetings.push(obj);
      await data.save();
    }
    res.json({ ok: true, msg: "Meeting created successfully" });
  } catch (error) {
    res.status(500).json({ ok: false, msg: error.message });
  }
});

BookingRouter.get("/:trainerId", async (req, res) => {
  try {
    const data = await MeetingModel.findOne({ trainer: req.params.trainerId });
    res.json({ ok: true, data });
  } catch (error) {
    res.status(500).json({ ok: false, msg: error.message });
  }
});

module.exports = {
  BookingRouter,
};
// {
//   "_id": {
//     "$oid": "645509efa817b6d6e53c4c24"
//   },
//   "trainer": {
//     "$oid": "64527477abde073483bf24d1"
//   },
//   "client": {
//     "$oid": "64527477abde073483bf24d1"
//   },
//   "start_time": {
//     "$date": "2023-06-01T10:00:00.000Z"
//   },
//   "end_time": {
//     "$date": "2023-06-01T14:00:00.000Z"
//   },
//   "status": "pending",
//   "createdAt": {
//     "$date": "2023-05-05T13:51:44.006Z"
//   },
//   "updatedAt": {
//     "$date": "2023-05-05T13:51:44.006Z"
//   },
//   "__v": 0
// }
