const express = require("express");
const router = express.Router();

module.exports = () => {
  router.post("/test", jsonParser, (req, res) => {
    console.log("test success");
    res.status(200).send({ data: "output" });
  });
};

// router.post("/loadDataVideoSrc", jsonParser, (req, res) => {
//   const data = require("./filedulieu/listOfVideos");
//   let output = "";
//   data.forEach((e) => {
//     if (e.id === req.body.id) {
//       output = e.videoSrc;
//     }
//   });
//   res.send({ data: output }).status(200);
// });
// router.post("/loadSrcVideoYoutube", jsonParser, (req, res) => {
//   const data = require("./filedulieu/listVideoYoutube");
//   let output = "";
//   data.forEach((e) => {
//     if (e.id === req.body.id) {
//       output = e.videoSrc;
//     }
//   });
//   res.send({ data: output }).status(200);
// });

// router.post("/loadDataIPA", jsonParser, (req, res) => {
//   const data = require("./filedulieu/C_IPA/A_IPA");
//   let output = [];
//   data.forEach((e) => {
//     if (e.id == req.body.id) {
//       output.push(e);
//     }
//   });

//   res.send({ data: output }).status(200);
// });

// router.post("/loadDataListen", jsonParser, (req, res) => {
//   const data = require("./filedulieu/D_LISTEN/DA_DATA");
//   let output = [];
//   data.forEach((e) => {
//     if (e.id == req.body.id) {
//       output.push(e);
//     }
//   });

//   res.send({ data: output }).status(200);
// });
