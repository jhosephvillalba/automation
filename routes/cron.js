// const express = require("express");
// const router = express.Router();
// const cron = require("node-cron");
// const authenticateToken = require("../middlewares/auth");
// const nodemailer = require("nodemailer");
// const axios = require("axios");

// // Configuración del transporte de correo
// const transporter = nodemailer.createTransport({
//   service: "Gmail",
//   host: "smtp.gmail.com",
//   port: 465,
//   secure: true,
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.APP_PASSWORD,
//   },
// });

// let scheduledTask = null; // Variable para mantener referencia al cron programado

// router.post("/schedule", authenticateToken, (req, res) => {
//   const { cronTime } = req.body;

//   // Validar el formato de cronTime
//   if (!cron.validate(cronTime)) {
//     return res.status(400).send("Invalid cron format");
//   }

//   // Detener la tarea programada actual si existe
//   if (scheduledTask) {
//     scheduledTask.stop();
//     console.log("Scheduled task stopped.");
//   }

//   const token = Buffer.from(`${process.env.USERNAME}:${process.env.PASSWORDSERVER}`, 'utf8').toString('base64');

//   // Programar la nueva tarea usando node-cron
//   scheduledTask = cron.schedule(cronTime, async () => {
//     try {
//       const response = await axios.get(
//         "https://grupozambrano.com/upload/process_zip.php", {
//           headers: {
//             'Authorization': `Basic ${token}`
//           }
//         }
//       );
//       console.log(`Task executed: ${response.data}`);

//       // Configuración del correo electrónico
//       const mailOptions = {
//         from: process.env.EMAIL_USER, // Dirección de correo del remitente
//         to: process.env.MY_EMAIL, // Dirección de correo del destinatario
//         subject: "Tarea Programada Ejecutada",
//         text: `La tarea programada se ejecutó correctamente. Respuesta: ${response.data}`,
//       };

//       // Enviar el correo electrónico
//       transporter.sendMail(mailOptions, (error, info) => {
//         if (error) {
//           return console.log(`Error sending email: ${error}`);
//         }
//         console.log("Email sent: " + info.response);
//       });
//     } catch (error) {
//       console.error(`Error executing task: ${error}`);
//     }
//   });

//   res.send("Task scheduled");
// });

// module.exports = router;


const express = require("express");
const router = express.Router();
const authenticateToken = require("../middlewares/auth");
const nodemailer = require("nodemailer");
const axios = require("axios");
const Agenda = require("agenda");
const cron = require("node-cron");

// Configuración del transporte de correo
const transporter = nodemailer.createTransport({
  service: "Gmail",
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.APP_PASSWORD,
  },
});

// Configuración de Agenda
const mongoConnectionString = "mongodb://localhost:27017/agenda";
const agenda = new Agenda({ db: { address: mongoConnectionString, collection: 'agendaJobs' } });

agenda.define('execute scheduled task', async (job) => {
  const token = Buffer.from(`${process.env.USERNAME}:${process.env.PASSWORDSERVER}`, 'utf8').toString('base64');

  try {
    const response = await axios.get(
      "https://grupozambrano.com/upload/process_zip.php", {
        headers: {
          'Authorization': `Basic ${token}`
        }
      }
    );
    console.log(`Task executed: ${response.data}`);

    // Configuración del correo electrónico
    const mailOptions = {
      from: process.env.EMAIL_USER, // Dirección de correo del remitente
      to: process.env.MY_EMAIL, // Dirección de correo del destinatario
      subject: "Tarea Programada Ejecutada",
      text: `La tarea programada se ejecutó correctamente. Respuesta: ${response.data}`,
    };

    // Enviar el correo electrónico
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.log(`Error sending email: ${error}`);
      }
      console.log("Email sent: " + info.response);
    });
  } catch (error) {
    console.error(`Error executing task: ${error}`);
  }
});

router.post("/schedule", authenticateToken, async (req, res) => {
  const { cronTime } = req.body;

  // Validar el formato de cronTime
  if (!cron.validate(cronTime)) {
    return res.status(400).send("Invalid cron format");
  }

  // Cancelar todas las tareas programadas anteriormente
  await agenda.cancel({ name: 'execute scheduled task' });

  // Programar la nueva tarea usando Agenda y establecer la zona horaria
  const job = agenda.create('execute scheduled task');
  job.repeatEvery(cronTime, {
    timezone: 'America/Bogota' // Establecer la zona horaria de Colombia
  });
  await job.save();

  res.send("Task scheduled");
});

// Iniciar Agenda
agenda.start();

module.exports = router;
