require('dotenv').config()

var appointment = require("../models/Appointment");

var mailer = require('nodemailer')

var AppointmentFactory = require("../factories/AppointmentFactory");
var mongoose = require("mongoose");

const Appo = mongoose.model("Appointment", appointment);

class AppointmentService {
  async Create(name, email, cpf, description, date, time) {
    var newAppo = new Appo({
      name,
      email,
      cpf,
      description,
      date,
      time,
      finished: false,
      notified: false,
    });
    try {
      await newAppo.save();
      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  async GetAll(showFinished) {
    if (showFinished) {
      return await Appo.find();
    } else {
      var appos = await Appo.find({ finished: false });
      var appointments = [];

      appos.forEach((appointment) => {
        if (appointment.date != undefined) {
          appointments.push(AppointmentFactory.Build(appointment));
        }
      });

      return appointments;
    }
  }
  async GetById(id) {
    try {
      var event = await Appo.findOne({ _id: id });
      return event;
    } catch (err) {
      console.log(err);
    }
  }
  async Finish(id) {
    try {
      await Appo.findByIdAndUpdate(id, { finished: true });
      return true
    } catch (err) {
      console.log(err);
      return false
    }
  }
  async Search(query){
    try{
      var appos= await Appo.find().or([{email: query},{cpf: query}])
     return appos;

    }catch(error){
      console.log(error)
      return []
    }
  }
  async SendNotification(){
   var appos = await this.GetAll(false);

   var transporter = mailer.createTransport({
    host: process.env.KEY_HOST_EMAIL,
    port: process.env.PORT_EMAIL,
    auth: {
      user: process.env.USER_EMAIL,
      pass: process.env.PASS_EMAIL,
    }
  });

   appos.forEach(async app =>{
     var date = app.start.getTime();
     var hour = 1000 * 60 * 60;
     var gap = date - Date.now();

     if(gap <= hour){

       if(!app.notified){

         await Appo.findByIdAndUpdate(app.id, {notified: true});

         transporter.sendMail({
           from: "Clebson Santos <clebsonsantos.dev@gmail.com>",
           to: app.email,
           subject: "Sua consulta vai acontecer em breve!",
           text: "Sua consulta vai acontecer em uma hora"

         }).then(()=>{
          

         }).catch(err => {
         })
         
       }
     }

   })
  }
}

module.exports = new AppointmentService();
