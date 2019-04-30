var express = require("express");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;

var TICKETS_COLLECTION = "tickets";

var app = express();
app.use(bodyParser.json());

// Create a database variable outside of the database connection callback to reuse the connection pool in your app.
var db;

// Connect to the database before starting the application server.
mongodb.MongoClient.connect(process.env.MONGODB_URI || "mongodb+srv://Tyler:pass@tickets-shbjr.mongodb.net/test?retryWrites=true", function (err, client) {
  if (err) {
    console.log(err);
    process.exit(1);
  }

  // Save database object from the callback for reuse.
  db = client.db();
  console.log("Database connection ready");

  // Initialize the app.
  var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
  });
});

//TICKET API ROUTES BELOW
// Generic error handler used by all endpoints.
function handleError(res, reason, message, code) {
    console.log("ERROR: " + reason);
    res.status(code || 500).json({"error": message});
}

app.get("/rest/tickets", function(req, res){
    db.collection(TICKETS_COLLECTION).find({}).toArray(function(err, docs) {
        if (err) {
          handleError(res, err.message, "Failed to get tickets.");
        } else {
            res.status(200).json(docs);
        }
      });
});

app.post("/rest/ticket", function(req, res) {
    var newTicket = req.body;
    newTicket.createDate = new Date();

    if (!req.body.created_at ||
        !req.body.updated_at ||
        !req.body.type ||
        !req.body.subject ||
        !req.body.description ||
        !req.body.priority ||
        !req.body.submitter ||
        !req.body.assignee_id ||
        !req.body.follower_ids ||
        !req.body.tags
    ) {
      handleError(res, "incomplete ticket info", "Fill all fields", 400);
    }
    else {
      db.collection(TICKETS_COLLECTION).insertOne(newTicket, function(err, doc) {
        if (err) {
          handleError(res, err.message, "Failed to create new ticket.");
        } else {
            res.status(201).json(doc.ops[0]);
        }
      });
    }
});

app.get("/rest/ticket/:id", function(req, res) {
    db.collection(TICKETS_COLLECTION).findOne({ _id: new ObjectID(req.params.id) }, function(err, doc) {
      if (err) {
        handleError(res, err.message, "Failed to get ticket");
      }
      else {
        res.status(200).json(doc);
      }
    });
});

app.put("/rest/ticket/:id", function(req, res) {
    var updateDoc = { $set: {
            created_at: req.body.created_at,
            updated_at: req.body.updated_at,
            type: req.body.type,
            subject: req.body.subject,
            description: req.body.description,
            priority: req.body.priority,
            submitter: req.body.submitter,
            assignee_id: req.body.assignee_id,
            follower_ids: req.body.follower_ids,
            tags: req.body.tags
        }
    }
    delete updateDoc._id;

    db.collection(TICKETS_COLLECTION).updateOne({_id: new ObjectID(req.params.id)}, updateDoc, function(err, doc) {
      if (err) {
        handleError(res, err.message, "Failed to update ticket");
      }
      else {
        updateDoc._id = req.params.id;
        res.status(200).json(updateDoc);
      }
    });
  });

  app.delete("/rest/ticket/:id", function(req, res) {
    db.collection(TICKETS_COLLECTION).deleteOne({_id: new ObjectID(req.params.id)}, function(err, result) {
      if (err) {
        handleError(res, err.message, "Failed to delete ticket");
      } else {
        res.status(200).json(req.params.id);
      }
    });
  });
