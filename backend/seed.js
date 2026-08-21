import dotenv from "dotenv";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import Vehicle from "./models/Vehicle.js";
import Driver from "./models/Driver.js";
import MaintenanceRecord from "./models/MaintenanceRecord.js";
import Geofence from "./models/Geofence.js";

dotenv.config();
await connectDB();

const run = async () => {
  try {
    // Clear existing
    await User.deleteMany();
    await Vehicle.deleteMany();
    await Driver.deleteMany();
    await MaintenanceRecord.deleteMany();
    await Geofence.deleteMany();

    // Admin
    await User.create({
      name: "Aditya",
      email: "aks09adi@gmail.com",
      password: "Aditya@0901",
      role: "admin",
    });
    console.log("✅ Admin user created");

    // Drivers
    const drivers = await Driver.insertMany([
      { name: "Rakesh Sharma", rfidId: "RFID-D001", licenseNumber: "WB-01-2020-001", phone: "9876543210", experience: 5, status: "On Duty", rating: 4.7, tripsCompleted: 342, onTimePercent: 96, safetyScore: 91, harshBrakingEvents: 3, avgSpeed: 34 },
      { name: "Manoj Singh", rfidId: "RFID-D002", licenseNumber: "WB-01-2019-045", phone: "9876543211", experience: 8, status: "On Duty", rating: 4.9, tripsCompleted: 510, onTimePercent: 98, safetyScore: 96, harshBrakingEvents: 1, avgSpeed: 31 },
      { name: "Suresh Das", rfidId: "RFID-D003", licenseNumber: "WB-01-2021-112", phone: "9876543212", experience: 3, status: "Off Duty", rating: 4.3, tripsCompleted: 178, onTimePercent: 89, safetyScore: 82, harshBrakingEvents: 7, avgSpeed: 38 },
      { name: "Anil Kumar", rfidId: "RFID-D004", licenseNumber: "WB-01-2018-078", phone: "9876543213", experience: 10, status: "On Duty", rating: 4.8, tripsCompleted: 640, onTimePercent: 97, safetyScore: 93, harshBrakingEvents: 2, avgSpeed: 33 },
    ]);
    console.log("✅ Drivers created");

    // Vehicles around Kolkata
    const vehicleData = [
      { vehicleNumber: "WB-01-AB-1234", rfidTag: "RFID-V001", status: "Active", location: { lat: 22.5726, lng: 88.3639 }, soc: 82, speed: 34 },
      { vehicleNumber: "WB-01-AB-5678", rfidTag: "RFID-V002", status: "Active", location: { lat: 22.5958, lng: 88.4098 }, soc: 65, speed: 41 },
      { vehicleNumber: "WB-01-AB-9012", rfidTag: "RFID-V003", status: "Idle", location: { lat: 22.5448, lng: 88.3426 }, soc: 91, speed: 0 },
      { vehicleNumber: "WB-01-AB-3456", rfidTag: "RFID-V004", status: "Active", location: { lat: 22.6139, lng: 88.4310 }, soc: 47, speed: 28 },
      { vehicleNumber: "WB-01-AB-7890", rfidTag: "RFID-V005", status: "Under Service", location: { lat: 22.5355, lng: 88.3636 }, soc: 12, speed: 0 },
      { vehicleNumber: "WB-01-AB-2468", rfidTag: "RFID-V006", status: "Idle", location: { lat: 22.5850, lng: 88.3468 }, soc: 100, speed: 0 },
    ];

    const vehicles = await Vehicle.insertMany(vehicleData);
    console.log("✅ Vehicles created");

    // Assign drivers to some active vehicles
    for (let i = 0; i < 3; i++) {
      vehicles[i].driver = drivers[i]._id;
      await vehicles[i].save();
      drivers[i].assignedVehicle = vehicles[i]._id;
      await drivers[i].save();
    }
    console.log("✅ Driver-Vehicle assignments done");

    // Maintenance / fuel / charging cost records
    await MaintenanceRecord.insertMany([
      { vehicle: vehicles[0]._id, type: "Charging", description: "Depot fast-charge", cost: 850, odometer: 45210, date: new Date("2026-08-01") },
      { vehicle: vehicles[0]._id, type: "Service", description: "Brake pad replacement", cost: 3200, odometer: 45400, date: new Date("2026-08-10") },
      { vehicle: vehicles[1]._id, type: "Charging", description: "Depot fast-charge", cost: 780, odometer: 38900, date: new Date("2026-08-03") },
      { vehicle: vehicles[1]._id, type: "Tyres", description: "Front tyre replacement", cost: 6400, odometer: 39200, date: new Date("2026-08-15") },
      { vehicle: vehicles[2]._id, type: "Insurance", description: "Annual premium", cost: 18500, odometer: 51000, date: new Date("2026-07-20") },
      { vehicle: vehicles[3]._id, type: "Repair", description: "AC compressor fix", cost: 5600, odometer: 22100, date: new Date("2026-08-12") },
      { vehicle: vehicles[4]._id, type: "Service", description: "Under-service full checkup", cost: 9200, odometer: 61500, date: new Date("2026-08-18") },
      { vehicle: vehicles[5]._id, type: "Charging", description: "Depot fast-charge", cost: 690, odometer: 15800, date: new Date("2026-08-20") },
    ]);
    console.log("✅ Maintenance/cost records created");

    // Geofence zones around Kolkata depot + city limit
    await Geofence.insertMany([
      { name: "Kolkata Depot Zone", center: { lat: 22.5726, lng: 88.3639 }, radius: 5000, active: true },
      { name: "Salt Lake Service Area", center: { lat: 22.5850, lng: 88.4200 }, radius: 3000, active: true },
    ]);
    console.log("✅ Geofence zones created");

    console.log("\n🎉 Seed complete! Login with:");
    console.log("   Email: aks09adi@gmail.com");
    console.log("   Password: Aditya@0901\n");
    process.exit();
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
};

run();
