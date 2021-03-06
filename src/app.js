const express = require("express");
const session = require("express-session");
const passport = require("passport");
const Local = require("passport-local").Strategy;
const Google = require("passport-google-oauth2").Strategy;
const bcrypt = require("bcryptjs");

const {
  findUserByEmail,
  createUser,
  newNote,
  findNote,
  getAllUsers,
} = require("./db");
const res = require("express/lib/response");

const app = express();

app.use(
  session({
    resave: false,
    secret: "asdwaad",
    saveUninitialized: false,
  })
);

app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());

const hash = (password) => {
  return bcrypt.hash(password, 10);
};

const compare = (password, hashed) => {
  return bcrypt.compare(password, hashed);
};

passport.serializeUser((user, done) => {
  done(null, user.email);
});

passport.deserializeUser(async (email, done) => {
  done(null, await findUserByEmail(email));
});

//adott példány jól működik-e
app.get("/health", (req, res) => {
  res.json({ ok: true, ...process.memoryUsage() });
});

// google Auth option
passport.use(
  new Google(
    {
      clientID:
        "535277913265-uhq5m421f0a0jm5rgfdli7j76eotqhrt.apps.googleusercontent.com",
      clientSecret: "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",
      callbackURL: "http://localhost:8000/google/callback",
    },

    async (req, actoken, reftoken, profile, done) => {
      const email = profile.email;
      const user = { email, password: "", provider: "google" };
      if (!(await findUserByEmail(email))) {
        await createUser(user);
      }
      done(null, user);
    }
  )
);

app.get("/google", passport.authenticate("google", { scope: ["email"] }));

app.get("/google/callback", passport.authenticate("google"), (req, res) => {
  res.json(req.user);
});

//Normal registration and login
passport.use(
  new Local(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email, password, done) => {
      if (!email || !password) {
        console.log("no cred");
        return done(null, false, { mesasge: "Please, fill in both fields. " });
      }

      const userInDb = await findUserByEmail(email);
      console.log("found user");

      const result = await compare(password, userInDb.password);

      if (result === true) {
        return done(null, userInDb);
      }
      return done(null, false, { mesasge: "Wrong credentials" });
    }
  )
);

//registration
app.post("/register", async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Please, fill in both fields." });
  }

  if (await findUserByEmail(email)) {
    return res.json({ message: "Email already exists" });
  }

  return hash(password)
    .then((hashed) => {
      return createUser({ email, password: hashed });
    })
    .then(() => {
      res.json({ ok: true });
    });
});

//login
app.post("/login", passport.authenticate("local"), (req, res, next) => {
  return res.json(req.user);
});

//newnote
app.post("/newnote", async (req, res, next) => {
  const user = req.body.email;
  const title = req.body.title;
  const list = req.body.list;
  console.log(user, title);
  return await newNote(user, title, list);
});

app.post("/getNote", async (req, res, next) => {
  const user = await findUserByEmail(req.body.email);
  const id = req.body.id;
  return findNote(user, id);
});

app.post("/getUser", async (req, res, next) => {
  const users = await getAllUsers();
  console.log(users.length);
  for (let i = 0; i < users.length; i++) {
    if (users[i].email == req.body.email) {
      console.log(users[i].notes);
      return res.json(users[i].notes);
    }
  }
});
//export
module.exports = app;
