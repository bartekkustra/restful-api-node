var path = require('path');
var sqlite3 = require('sqlite3').verbose();
var express = require('express');
var bodyParser = require('body-parser');

var app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var HOST_ADDR = 'localhost';
var HOST_PORT = process.env.PORT || 3000;
var router = express.Router();

// connect to db
var dbPath = path.resolve(__dirname, 'resttest.sqlite');
var db = new sqlite3.Database(dbPath);

// initialize DB
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS 
            "users"( 
              "id" Integer NOT NULL PRIMARY KEY AUTOINCREMENT,
              "email" Text NOT NULL,
              "password" Text NOT NULL,
              "name" Text NOT NULL,
              "profession" Text,
              CONSTRAINT "unique_email" UNIQUE ( "email" )
            );
  `);
});

// middleware to use for all requests
router.use((req, res, next) => {
  // log everything
  console.log('Something is happening...');
  next();
});

// test route to make sure everything is ok
router.get('/', (req, res) => res.json({ message: "Welcome to the API!" }));

/*
* /api/users           GET     Get all users
* /api/users           POST    Create a user
* /api/users/:userid   GET     Get a single user
* /api/users/:userid   PUT     Update a user with new info
* /api/users/:userid   DELETE  Delete a user
*/
router.route('/users')

  // GET /api/users
  .get((req, res) => {
    db.all('SELECT * FROM users', (err, row) => {
      if(err) {
        res.status(500);
        res.json({
          status: 500,
          error: err,
        })
      } else {
        res.json(row)
      }
    })
  })

  // POST /api/users (name, profession?)
  .post((req, res) => {
    var email = req.body.email;
    var password = req.body.password;
    var name = req.body.name;
    var profession = req.body.profession;

    query = `INSERT INTO users ("email", "password", "name", "profession") VALUES ("${email}", "${password}", "${name}", "${profession}");`
    console.log('query', query);
    
    db.run(query, (err, row) => {
      if(err) {
        res.status(500);
        res.json({
          status: 500,
          error: err,
        });
      } else {
        res.json({
          status: 200,
          error: err,
          response: {
            message: "User created!"
          },
        });
      }
      res.end();
    });
  });

router.route('/users/:userid')

  // GET /users/123
  .get((req, res) => {
    var query = `SELECT * FROM users WHERE id=${req.params.userid};`;
    db.all(query, (err, row) => {
      if(err) {
        res.status(500);
        res.json({
          status: 500,
          error: err,
        })
      } else {
        res.json({
          status: 200,
          error: err,
          response: row,
        });
      }
    })
    res.end();
  })

  // PUT /users/123
  .put((req, res) => {
    var email = req.body.email || "";
    var password = req.body.password || "";
    var name = req.body.name || "";
    var profession = req.body.profession || "";

    var changeArr = [];

    if(email) { changeArr.push(`"email" = '${email}'`); }
    if(password) { changeArr.push(`"password" = '${password}'`); }
    if(name) { changeArr.push(`"name" = '${name}'`); }
    if(profession) { changeArr.push(`"profession" = '${profession}'`)}

    if(!email && !password && !name && !profession) {
      res.json({
        status: 500,
        error: "At least one parameter required",
      });
    } else {
      var query = `UPDATE "users" SET ${changeArr.join(', ')} WHERE "id" = ${req.params.userid};`;
      db.run(query, (err, row) => {
        if(err) {
          res.status(500);
          res.json({
            status: 500,
            error: err,
          });
        } else {
          res.json({
            status: 200,
            error: err,
            response: {
              message: "User updated!"
            },
          });
        }
        res.end();
      });
    }
  })

  // DELETE /users/123
  .delete((req, res) => {
    var query = `DELETE FROM users WHERE id = ${req.params.userid};`;
    db.run(query, (err, row) => {
      if(err) {
        res.status(500);
        res.json({
          status: 500,
          error: err,
        });
      } else {
        res.json({
          status: 200,
          error: err,
          response: {
            message: "User removed!"
          },
        });
      }
      res.end();
    })
  })

// force /api path for api calls
app.use('/api', router);

app.listen(HOST_PORT);

console.log(`Submit GET or POST to ${HOST_ADDR}:${HOST_PORT}`);
