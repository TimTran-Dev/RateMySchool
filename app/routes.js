module.exports = function(app, passport, db, mongoose, ObjectId, multer) {
  app.get("/", function(req, res) {
    res.render("index.ejs");
  });


            //user login to profile

  app.get("/profile", isLoggedIn, function(req, res) {
    var uId = ObjectId(req.session.passport.user)
    db.collection("users")
      .find({"_id": uId})
      .toArray((err, result) => {
        if (err) return console.log(err);
        res.render("profile.ejs", {
          user: req.user,
          userInfo: result
        });
      });
  });

  app.post('/profile', (req, res) => {
    var uId = ObjectId(req.session.passport.user)
    db.collection('users')
      .findOneAndUpdate({
        "_id": uId
      }, {
        $set: {
          'name': req.body.name,
          'school': req.body.school
        }
      }, {
        sort: {
          _id: -1
        },
        upsert: false
      }, (err, result) => {
        if (err) return res.send(err)
        res.render("profile.ejs", {
          user: req.user,
          userInfo: result
        });
      })
  })


  app.delete("/profile", (req, res) => {
    console.log(req.body);
    db.collection("users").findOneAndDelete(
      { name: req.body.name, school: req.body.school },
      (err, result) => {
        if (err) return res.send(500, err);
        res.send("Message deleted!");
      }
    );
  });


  app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/");
  });

              //School redirecting start

  app.get("/search", isLoggedIn, function(req, res) {
    console.log("user", req.user)
    db.collection("users")
      .find()
      .toArray((err, result) => {
        if (err) return console.log(err);
        res.render("Schools.ejs", {
          user: req.user,
          reviews: result
        });
      });
  });


  app.post("/search", (req, res) => {

    db.collection("userReview").save(
      { userReview: req.body.userReview },
      db.collection("schools")
      .find({ "properties.SCH_NAME": req.body.schoolSearch })
      .toArray((err, result) => {
        if (err) return console.log(err);
        console.log(result);
        res.render("School.ejs", { schools: result, user: req.user,
          reviews: result });
      }),
  });


              //School redirecting ends





              //user creates reviews



  app.post("/userReview", (req, res) => {
    console.table(req.body);
    db.collection("userReview").save(
      { userReview: req.body.userReview },
      (err, result) => {
        if (err) return console.log(err);
        console.log("saved to database");
        res.redirect("/search");
      }
    );
  });

                // image code starts


  var storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "public/images/uploads");
    },
    filename: (req, file, cb) => {
      cb(null, file.fieldname + "-" + Date.now() + ".png");
    }
  });
  var upload = multer({ storage: storage });
  app.post("/up", upload.single("file-to-upload"), (req, res, next) => {
    insertDocuments(db, req, "images/uploads/" + req.file.filename, () => {
      res.redirect("/profile");
    });
  });
  app.post("/up", upload.single("file-to-upload"), (req, res, next) => {
    insertDocuments(db, req, "images/uploads/" + req.file.filename, () => {
      res.redirect("/search");
    });
  });
  var insertDocuments = function(db, req, filePath, callback) {
    var collection = db.collection("users");
    var uId = ObjectId(req.session.passport.user);
    collection.findOneAndUpdate(
      { "_id": uId },
      {
        $set: {
          photo: filePath,
        }
      },
      {
        sort: { _id: -1 },
        upsert: false
      },
      (err, result) => {
        if (err) return res.send(err);
        callback(result);
      }
    );
  };

              // image code ends







  app.get("/login", function(req, res) {
    res.render("login.ejs", { message: req.flash("loginMessage") });
  });
  app.post(
    "/login",
    passport.authenticate("local-login", {
      successRedirect: "/profile",
      failureRedirect: "/signUp",
      failureFlash: true
    })
  );
  app.get("/signUp", function(req, res) {
    res.render("signUp.ejs", { message: req.flash("signupMessage") });
  });
  app.get("/search", function(req, res) {
    res.render("School.ejs", { message: req.flash("signupMessage"), user: req.user, reviews: result });
  });
  app.post(
    "/signUp",
    passport.authenticate("local-signup", {
      successRedirect: "/profile",
      failureRedirect: "/signUp",
      failureFlash: true
    })
  );
  app.get("/unlink/local", isLoggedIn, function(req, res) {
    var user = req.user;
    user.local.email = undefined;
    user.local.password = undefined;
    user.save(function(err) {
      res.redirect("/profile");
    });
  });
};
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/");
}
