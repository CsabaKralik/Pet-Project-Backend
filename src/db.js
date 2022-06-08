const { nanoid } = require("nanoid");

const init = async (fp) => {
  const lowdb = await import("lowdb");
  const adapter = new lowdb.JSONFile(fp);
  db = new lowdb.Low(adapter);
  await db.read();
  db.data ||= { users: [] };
  return db.write();
};
init("lowdb");

const getAllUsers = async () => {
  await db.read();
  return db.data.users;
};

const findUserByEmail = async (email) => {
  await db.read();
  return db.data.users.find((user) => {
    user.email === email;
    return user.email === email;
  });
};

const createUser = async (user) => {
  await db.read();
  db.data.users.push(user);
  return db.write();
};

const newNote = async (user, title, list) => {
  await db.read();
  const userInDb = await findUserByEmail(user);
  userInDb.notes ||= [];
  let id = 0;
  if (userInDb.notes.length > 0) {
    console.log(userInDb.notes.length);
    console.log(userInDb.notes[userInDb.notes.length - 1].id);
    console.log(id);

    id += userInDb.notes[userInDb.notes.length - 1].id;
    console.log(id);

    id += 1;
    console.log(id);
  }
  userInDb.notes.push({ id, title, list });
  return db.write();
};

const findNote = async (user, id) => {
  await db.read();
  user.notes.forEach((note) => {
    if (note.id === id) {
      return note;
    }
  });
};

module.exports = {
  init,
  getAllUsers,
  findUserByEmail,
  createUser,
  newNote,
  findNote,
};
