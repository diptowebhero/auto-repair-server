const express = require("express");
const app = express();
require("dotenv").config();
const { MongoClient } = require("mongodb");
const port = process.env.PORT || 5000;
const cors = require("cors");
const ObjectId = require("mongodb").ObjectId;
const fileUpload = require("express-fileupload");
//middleware
app.use(cors());
app.use(express.json());
app.use(fileUpload());
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mxsis.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    await client.connect();
    const database = client.db("carRepairShop");
    const services_collection = database.collection("services");
    const order_collection = database.collection("order");
    const review_collection = database.collection("review");
    const user_collection = database.collection("user");

    //load services
    app.get("/services", async (req, res) => {
      const cursor = services_collection.find({});
      const result = await cursor.toArray();
      res.json(result);
    });

    //load single data
    app.get("/order/:id", async (req, res) => {
      const id = req.params.id;
      const order = { _id: ObjectId(id) };
      const result = await services_collection.find(order).toArray();
      res.json(result);
    });
    //add orders
    app.post("/addOrder", async (req, res) => {
      const order = req.body;
      order.status = "Pending";
      delete order._id;
      const result = await order_collection.insertOne(order);
      res.json(result);
    });
    //add review
    app.post("/review", async (req, res) => {
      const review = req.body;
      const result = await review_collection.insertOne(review);
      res.json(result);
    });

    //load my orders
    app.get("/orders/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await order_collection.find(query).toArray();
      res.json(result);
    });

    //load review
    app.get("/review", async (req, res) => {
      const result = await review_collection.find({}).toArray();
      res.json(result);
    });

    //delete my orders
    app.delete("/delete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await order_collection.deleteOne(query);
      res.json(result);
    });

    //load all orders
    app.get("/orders", async (req, res) => {
      const orders = await order_collection.find({}).toArray();
      res.json(orders);
    });

    //confirm order
    app.put("/confirm/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const updateDoc = {
        $set: {
          status: "Approved",
        },
      };
      const result = await order_collection.updateOne(query, updateDoc);
      res.json(result);
    });

    //add user to the database
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await user_collection.insertOne(user);
      res.json(result);
      console.log(result);
    });
    //up-sert google sign in
    app.put("/users", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const options = { upsert: true };
      const updateDoc = { $set: user };
      const result = await user_collection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.json(result);
    });
    //add admin role
    app.put("/users/admin", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const updateDoc = { $set: { role: "admin" } };
      const result = await user_collection.updateOne(filter, updateDoc);
      res.json(result);
      console.log(result);
    });
    //load admin data
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await user_collection.findOne(query);
      let isAdmin = false;
      if (result?.role === "admin") {
        isAdmin = true;
      }
      res.json({ admin: isAdmin });
    });
    //upload img
    app.post("/services", async (req, res) => {
      
      const title = req.body.title;
      const price = req.body.price;
      const desc = req.body.desc;
      const pic = req.files.img;
      const picData = pic.data;
      const encodePic = picData.toString("base64");
      const imageBuffer = Buffer.from(encodePic, "base64");
      const service = {
        title,
        price,
        desc,
        img: imageBuffer,
      };
      const result = await services_collection.insertOne(service);
      res.json(result);
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);
app.get("/", (req, res) => {
  res.send("car repair shop server is running");
});

app.listen(port, () => {
  console.log("listening from", port);
});
