const express = require("express");
const { connection } = require("./config/db");
const { logger } = require("./middlewares/logger.middleware");
const { userRoute } = require("./routes/user.routes");
// const swaggerJSDoc = require("swagger-jsdoc");
// const swaggerUi = require("swagger-ui-express");
const { BookingRouter } = require("./routes/booking.routes");
const { authRoute } = require("./routes/auth.routes");
const cors = require("cors");
require("dotenv").config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(logger);
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
// port 4500
app.get("/", (req, res) => {
  try {
    res.send({ ok: true, msg: "Welcome to Backend of FlexFit" });
  } catch (error) {
    res.send({ ok: false, msg: error.message });
  }
});
app.use("/user", userRoute);
// const options = {
//   definition: {
//     openapi: "3.0.0",
//     info: {
//       title: "Node JS API Project for FlexFit",
//       version: "1.0.0",
//       description:
//         "About : - This is a Trainer Booking application in which you can hire Top quality Trainer or become a Trainer and this is documentation of application FlexFit.",
//       license: {
//         name: "FlexFit",
//       },
//       contact: {
//         name: "FlexFit",
//         url: "FlexFit.com",
//         email: "flex@gmail.com",
//       },
//     },
//     servers: [
//       {
//         url: "http://localhost:3000/",
//       },
//     ],
//   },
//   apis: ["./routes/*.js"],
// };
// const swaggerSpec = swaggerJSDoc(options);
// app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/auth", authRoute);
app.use("/book", BookingRouter);

app.listen(process.env.PORT, async () => {
  try {
    await connection;
    console.log("Connected to MongoDb Database");
    // await client.connect();
    // console.log("Connected to Redis Database");
  } catch (error) {
    console.log(error.message);
    console.log("Database not Connected");
  }
  console.log(`Server is running at port ${process.env.PORT}`);
});
