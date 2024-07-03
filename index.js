import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcrypt";
import "dotenv/config";


const app = express();
const port = 3000;
const username = process.env.MONGO_USERNAME;
const password = encodeURIComponent(process.env.MONGO_PASSWORD);
app.use(express.json());
app.use(cors({
    origin: "*"
}));
app.use(express.urlencoded({extended : true}));

const dbSchema = new mongoose.Schema({
    mydetails: [
        {
            image: {
                type: String,
            },
            name: {
                type: String,
                required: true,
            },
            email: {
                type: String,
                required: true,
            },
            role: {
                type: String,
                required: true,
            },
            totalExp: {
                type: Number,
                required: true,
            },
        }
    ],
    aboutme: [
        {
            about: {
                type: String,
                required: true,
            },
            aboutPoint: {
                type: Array,
                required: true,
            },
        }
    ],
    skills: [
        {
            data: {
                type: Array,
            },
        }
    ],
    work: [
        {
            workExperience: {
                type: Array,
            },
        }
    ],
});

const dbModel = mongoose.model("information", dbSchema);

app.get("/", async (req, res) => {
    const data = await dbModel.find();
    res.send(data);
    console.log(data);
});

app.post("/send", async ( req, res ) => {
    const dataToSave = new dbModel (req.body);
    await dataToSave.save();
    res.send("Data Saved Successfully");
    console.log(dataToSave);
});

const rgSchema = new mongoose.Schema({
    name: {
        type: String,
    },
    email: {
        type: String,
    },
    createPassword: {
        type: String,
    },
    confirmPassword:{
        type: String,
    },
    lastLogin: {
        type: Date,
        default: null,
    },
});

const rgModel = mongoose.model("register", rgSchema);

app.get("/register", async ( req, res ) => {
    const user = await rgModel.find();
    res.send(user);
    console.log(user);
});

app.post("/datasave", async ( req, res ) => {
    const user = req.body;
    console.log(req.body);

    try {
        const userExist = await rgModel.findOne({ email: user.email });
        if(userExist){
            return res.status(400).json({ message: "Email already Exists"});
        }

        const salt = await bcrypt.genSalt();
        const hashCreatePassword = await bcrypt.hash(user.createPassword, salt);
        user.createPassword = hashCreatePassword;

        const hashConfirmPassword = await bcrypt.hash(user.confirmPassword, salt);
        user.confirmPassword = hashConfirmPassword;

        const registerUser = new rgModel(user);
        await registerUser.save();
        res.status(200).json({ message: "Registration Successfully", registerUser});
        console.log(registerUser);
    }
    catch(error) {
        console.log(error);
    }
});

app.post("/login", async ( req, res) => {
    const { email, password } = req.body;
    try {
        const user = await rgModel.findOne({ email });
        if(!user){
            return res.status(400).json({ message: "Email not registered" });
        }
        
        const passwordMatch = await bcrypt.compare( password, user.createPassword);
        if(!passwordMatch){
            return res.status(401).json({ message: "Incorrect password" });
        }
        user.lastLogin = new Date();
        await user.save();
        res.status(200).json({ message: "Login successfully", user });
    }
    catch(error) {
        console.error(error);
    }
});

app.get("/userData", async ( req, res ) => {
    const { email } = req.query;
    try {
        const user = await rgModel.findOne({ email });
        if(!user){
            return res.status(404).json({ message: "User not found" });
        }
        const resumeProfiles = await dbModel.find({ "mydetails.email": email });
        res.status(200).json({ user, resumeProfiles });
    }
    catch(error) {
        console.log("Error fetching user data:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

app.delete("/delete/:id", async ( req, res ) => {
    try{
        const idToDelete = req.params.id;
        console.log("Id", idToDelete);
        await dbModel.deleteOne({ _id: idToDelete });
        res.status(200).send("Successfully deleted");
    }
    catch(error) {
        console.error("Error:", error);
        res.status(400).json({ message: error.message });
    }
});

app.get("/get/:id", async ( req, res ) => {
    try {
        const id = req.params.id;
        const data = await Resume.findById(id);
        res.json(data);
    }
    catch(error) {
        res.status(404).json({ message: "Data not found" });
    }
});

app.put("/update/:id", async ( req, res ) => {
    try {
        const { id, updatedData } = req.body;
        const updatedResume = await Resume.findByIdAndUpdate(id, updatedData, { new: true });
        res.json(updatedResume);
    }
    catch(error) {
        res.status(400).json({ message: "Failed to update data" });
    }
});


mongoose.connect(
    "mongodb+sev://" + username + ":" + password + "@cluster0.5x1hoaw.mongodb.net/resume?retryWrites=true&w=majority&appName=Cluster0"
)
.then(() => app.listen(port, () => {
    console.log("Server Started at port 3000");
}))
.catch((error) => {
    console.log(error);
});