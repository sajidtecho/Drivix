import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

// 1. Your Firebase Config (Copy-pasted from your .env/firebase.js)
const firebaseConfig = {
    apiKey: "AIzaSyAL2JrL7YR55GaFAMg2klKh3oB1eCU2xGk",
    authDomain: "drivix-3ad9f.firebaseapp.com",
    projectId: "drivix-3ad9f",
    storageBucket: "drivix-3ad9f.firebasestorage.app",
    messagingSenderId: "512528352400",
    appId: "1:512528352400:web:642f66db5163575c43c415"
};

// 2. Initialize
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function exportToCSV() {
    console.log("🚀 Fetching bookings from Firestore...");

    try {
        const querySnapshot = await getDocs(collection(db, "bookings"));
        const bookings = [];

        querySnapshot.forEach((doc) => {
            bookings.push({ id: doc.id, ...doc.data() });
        });

        if (bookings.length === 0) {
            console.log("❌ No bookings found to export.");
            return;
        }

        // 3. Define the CSV Headers
        const headers = [
            "bookingId", "locationName", "slotId", "floor",
            "entryDate", "entryTime", "duration", "totalCost",
            "vehicleName", "status", "createdAt"
        ];

        // 4. Convert JSON to CSV String
        const csvRows = [];
        csvRows.push(headers.join(",")); // Add header row

        for (const b of bookings) {
            const row = headers.map(header => {
                let value = b[header] || "";
                // Handle timestamps or objects
                if (value && typeof value === 'object' && value.seconds) {
                    value = new Date(value.seconds * 1000).toISOString();
                }
                // Wrap in quotes to handle commas in names/addresses
                return `"${value}"`;
            });
            csvRows.push(row.join(","));
        }

        // 5. Save to File
        fs.writeFileSync("bookings_dataset.csv", csvRows.join("\n"));

        console.log(`\n✅ Success! Exported ${bookings.length} bookings to 'bookings_dataset.csv'`);
        process.exit(0);
    } catch (error) {
        console.error("Error exporting data:", error);
        process.exit(1);
    }
}

exportToCSV();
