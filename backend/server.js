require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const app = express();

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "*";
const MIGRATION_KEY = process.env.MIGRATION_KEY || "";

if (!MONGODB_URI || !JWT_SECRET) {
  console.error("Missing MONGODB_URI or JWT_SECRET in .env");
  process.exit(1);
}

app.use(helmet());
const allowedOrigins = FRONTEND_ORIGIN === "*" ? null : FRONTEND_ORIGIN.split(",").map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || !allowedOrigins || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("CORS origin not allowed"));
  },
  credentials: false
}));
app.use(express.json({ limit: "12mb" }));

let dbPromise = null;
async function connectDB(){
  if (mongoose.connection.readyState === 1) return;
  if (!dbPromise) {
    dbPromise = mongoose.connect(MONGODB_URI).then(ensureSeed).catch(err => {
      dbPromise = null;
      throw err;
    });
  }
  await dbPromise;
}

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    res.status(503).json({ message: "Database unavailable", error: err.message });
  }
});

const userSchema = new mongoose.Schema({
  username: {type:String, required:true, unique:true, trim:true, minlength:3, maxlength:50},
  passwordHash: {type:String, required:true},
  role: {type:String, enum:["admin","viewer"], default:"viewer"},
  created: {type:Date, default:Date.now}
}, {timestamps:true});

const portalSchema = new mongoose.Schema({
  key: {type:String, unique:true, default:"main"},
  data: {type:mongoose.Schema.Types.Mixed, required:true},
  hero: {type:mongoose.Schema.Types.Mixed, required:true},
  theme: {type:String, enum:["light","dark"], default:"light"},
  recoveryCodeHash: {type:String, required:true}
}, {timestamps:true});

const User = mongoose.model("User", userSchema);
const Portal = mongoose.model("Portal", portalSchema);

const DEFAULT_LINES = [
  {number:"1",name:"Red Line"},{number:"2",name:"Yellow Line"},
  {number:"3",name:"Blue Line"},{number:"4",name:"Green Line"},
  {number:"5",name:"Violet Line"},{number:"6",name:"Orange Line"},
  {number:"7",name:"Pink Line"},{number:"8",name:"Magenta Line"},
  {number:"9",name:"Aqua Line"},{number:"10",name:"Grey Line"}
];
const PRESET_COLORS = [
  "#E53935","#F9A825","#1E88E5","#43A047","#8E24AA",
  "#FB8C00","#EC407A","#C2185B","#00ACC1","#546E7A"
];
const LINE_PHOTOS = [
  "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=600&q=70",
  "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=70",
  "https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=600&q=70",
  "https://images.unsplash.com/photo-1532105956626-9569c03602f6?auto=format&fit=crop&w=600&q=70",
  "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=600&q=70",
  "https://images.unsplash.com/photo-1519677100203-a0e668c92439?auto=format&fit=crop&w=600&q=70",
  "https://images.unsplash.com/photo-1516110833967-0b5716ca1387?auto=format&fit=crop&w=600&q=70",
  "https://images.unsplash.com/photo-1473445361085-b9a07f55608b?auto=format&fit=crop&w=600&q=70",
  "https://images.unsplash.com/photo-1553864139-1b7982a8b5a1?auto=format&fit=crop&w=600&q=70",
  "https://images.unsplash.com/photo-1495312040802-a929cd14a6ab?auto=format&fit=crop&w=600&q=70"
];
const DEFAULT_ITEMS = [
  {title:"Simple Line Diagram",icon:"🗺️",desc:"पूरी लाइन का सरल नक्शा / schematic",link:"",photo:""},
  {title:"Track Detail One Spot",icon:"📍",desc:"किसी एक spot का विस्तृत track detail",link:"",photo:""},
  {title:"Curve",icon:"🌀",desc:"Curve details, radius और superelevation",link:"",photo:""},
  {title:"Point",icon:"⚙️",desc:"Point / switch ki jaankari",link:"",photo:""},
  {title:"Fittings",icon:"🔧",desc:"Rail fittings aur fastenings",link:"",photo:""},
  {title:"Gradient",icon:"📐",desc:"Gradient profile aur levels",link:"",photo:""},
  {title:"Buffer Stop",icon:"🛑",desc:"Buffer stop ki detail aur photo",link:"",photo:""},
  {title:"AT Weld",icon:"🔥",desc:"Alumino-Thermic weld history",link:"",photo:""},
  {title:"Rail Replacement History",icon:"📜",desc:"Rail badalne ka poora record",link:"",photo:""},
  {title:"Turnout History",icon:"🔀",desc:"Turnout ki poori history",link:"",photo:""}
];
const HERO_DEFAULT = {
  tag:"LIVE • P-WAY MANAGEMENT SYSTEM",
  heading:"Metro ki Har Line ki Poori Jaankari\nEk Hi Jagah",
  highlight:"Har Line",
  desc:"Track diagrams, curves, points, fittings, gradients, welds, aur poori history — sab kuch organised aur ek click par.",
  photo:"https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1600&q=80",
  accent:"#ffd166",
  overlay:100
};

function uid(){ return crypto.randomBytes(5).toString("hex"); }
function buildDefaultData(){
  return {lines: DEFAULT_LINES.map((l,i)=>({
    id:uid(), number:l.number, name:l.name, color:PRESET_COLORS[i], photo:LINE_PHOTOS[i],
    items:DEFAULT_ITEMS.map(it=>({id:uid(),...it}))
  }))};
}
function hashSecret(value){ return crypto.createHash("sha256").update(String(value)).digest("hex"); }

async function ensureSeed(){
  let portal = await Portal.findOne({key:"main"});
  if(!portal){
    const initialRecovery = process.env.DEFAULT_RECOVERY_CODE || "METRO-2026-RESET";
    portal = await Portal.create({
      key:"main", data:buildDefaultData(), hero:HERO_DEFAULT, theme:"light",
      recoveryCodeHash:hashSecret(initialRecovery)
    });
  }
  const adminCount = await User.countDocuments({role:"admin"});
  if(adminCount === 0){
    const username = process.env.DEFAULT_ADMIN_USERNAME || "admin";
    const password = process.env.DEFAULT_ADMIN_PASSWORD || "metro123";
    await User.create({username, passwordHash:await bcrypt.hash(password,12), role:"admin"});
    console.log(`Default admin ensured: ${username}`);
  }
}

function publicUser(u){
  return {id:String(u._id), username:u.username, role:u.role, created:u.created};
}
function signToken(u){
  return jwt.sign({sub:String(u._id),username:u.username,role:u.role},JWT_SECRET,{expiresIn:"7d"});
}
function auth(req,res,next){
  const h=req.headers.authorization||"";
  if(!h.startsWith("Bearer ")) return res.status(401).json({message:"Login required"});
  try { req.auth=jwt.verify(h.slice(7),JWT_SECRET); next(); }
  catch(e){ return res.status(401).json({message:"Session expired. Login again."}); }
}
function admin(req,res,next){
  if(req.auth?.role!=="admin") return res.status(403).json({message:"Admin access required"});
  next();
}

app.get("/api/health",(req,res)=>res.json({ok:true,service:"metro-pway-backend",database:mongoose.connection.readyState===1?"connected":"disconnected"}));

app.post("/api/auth/login",async(req,res)=>{
  const {username,password}=req.body||{};
  const u=await User.findOne({username:String(username||"").trim()});
  if(!u || !(await bcrypt.compare(String(password||""),u.passwordHash))) return res.status(401).json({message:"Galat username ya password"});
  res.json({token:signToken(u),user:publicUser(u)});
});
app.get("/api/auth/me",auth,async(req,res)=>{
  const u=await User.findById(req.auth.sub);
  if(!u) return res.status(401).json({message:"User not found"});
  res.json({user:publicUser(u)});
});
app.post("/api/auth/logout",auth,(req,res)=>res.json({ok:true}));
app.post("/api/auth/change-password",auth,async(req,res)=>{
  const {currentPassword,newPassword}=req.body||{};
  if(String(newPassword||"").length<5) return res.status(400).json({message:"New password 5+ characters hona chahiye"});
  const u=await User.findById(req.auth.sub);
  if(!u || !(await bcrypt.compare(String(currentPassword||""),u.passwordHash))) return res.status(400).json({message:"Current password galat"});
  u.passwordHash=await bcrypt.hash(String(newPassword),12); await u.save();
  res.json({ok:true});
});
app.post("/api/auth/recover-password",async(req,res)=>{
  const {username,recoveryCode,newPassword}=req.body||{};
  if(String(newPassword||"").length<5) return res.status(400).json({message:"Password 5+ characters hona chahiye"});
  const portal=await Portal.findOne({key:"main"});
  if(!portal || hashSecret(recoveryCode)!==portal.recoveryCodeHash) return res.status(400).json({message:"Secret code galat hai"});
  const u=await User.findOne({username:String(username||"").trim()});
  if(!u) return res.status(404).json({message:"Username nahi mila"});
  u.passwordHash=await bcrypt.hash(String(newPassword),12); await u.save();
  res.json({ok:true});
});

app.get("/api/users",auth,async(req,res)=>{
  const users=await User.find().sort({created:1});
  res.json({users:users.map(publicUser)});
});
app.post("/api/users",auth,admin,async(req,res)=>{
  const {username,password,role}=req.body||{};
  if(String(username||"").trim().length<3) return res.status(400).json({message:"Username 3+ characters hona chahiye"});
  if(String(password||"").length<5) return res.status(400).json({message:"Password 5+ characters hona chahiye"});
  if(!["admin","viewer"].includes(role)) return res.status(400).json({message:"Invalid role"});
  try{
    const u=await User.create({username:String(username).trim(),passwordHash:await bcrypt.hash(String(password),12),role});
    res.status(201).json({user:publicUser(u)});
  }catch(e){ if(e.code===11000) return res.status(409).json({message:"Username already exists"}); throw e; }
});
app.delete("/api/users/:id",auth,admin,async(req,res)=>{
  if(req.params.id===req.auth.sub) return res.status(400).json({message:"Current user delete nahi kar sakte"});
  const target=await User.findById(req.params.id);
  if(!target) return res.status(404).json({message:"User not found"});
  if(target.role==="admin" && await User.countDocuments({role:"admin"})<=1) return res.status(400).json({message:"Kam se kam ek admin chahiye"});
  await target.deleteOne();
  res.json({ok:true});
});

app.get("/api/portal",async(req,res)=>{
  const p=await Portal.findOne({key:"main"});
  res.json({data:p.data,hero:p.hero,theme:p.theme});
});
app.put("/api/portal",auth,admin,async(req,res)=>{
  const p=await Portal.findOne({key:"main"});
  if(!req.body?.data?.lines) return res.status(400).json({message:"Invalid portal data"});
  p.data=req.body.data; await p.save();
  res.json({data:p.data});
});
app.put("/api/portal/hero",auth,admin,async(req,res)=>{
  const p=await Portal.findOne({key:"main"});
  p.hero=Object.assign({},HERO_DEFAULT,req.body||{}); await p.save();
  res.json({hero:p.hero});
});
app.put("/api/portal/preferences",auth,async(req,res)=>{
  const p=await Portal.findOne({key:"main"});
  if(req.body?.theme) p.theme=req.body.theme==="dark"?"dark":"light";
  await p.save(); res.json({theme:p.theme});
});
app.put("/api/settings/recovery-code",auth,admin,async(req,res)=>{
  const code=String(req.body?.recoveryCode||"").trim();
  if(code.length<6) return res.status(400).json({message:"Secret code 6+ characters hona chahiye"});
  const p=await Portal.findOne({key:"main"});
  p.recoveryCodeHash=hashSecret(code); await p.save();
  res.json({ok:true});
});
app.post("/api/admin/reset-portal",auth,admin,async(req,res)=>{
  const p=await Portal.findOne({key:"main"});
  p.data=buildDefaultData(); p.hero=HERO_DEFAULT; p.theme="light"; await p.save();
  res.json({data:p.data,hero:p.hero,theme:p.theme});
});
app.post("/api/admin/reset-users",auth,admin,async(req,res)=>{
  const username=process.env.DEFAULT_ADMIN_USERNAME||"admin";
  const password=process.env.DEFAULT_ADMIN_PASSWORD||"metro123";
  await User.deleteMany({});
  await User.create({username,passwordHash:await bcrypt.hash(password,12),role:"admin"});
  res.json({ok:true});
});

app.use((err,req,res,next)=>{
  console.error(err);
  res.status(500).json({message:"Internal server error"});
});

if (!process.env.VERCEL) {
  connectDB().then(()=>app.listen(PORT,()=>console.log(`Backend running on port ${PORT}`)))
    .catch(err=>{ console.error("MongoDB connection failed:",err); process.exit(1); });
}

module.exports=app;
