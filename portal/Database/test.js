const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://laneenos:laneenos2025@clusterdigital.zmphh.mongodb.net/?retryWrites=true&w=majority&appName=Clusterdigital"; // Replace with your MongoDB URI
const client = new MongoClient(uri);

const students = [
    { key: "1", id: "35013", name: "Janet", class: "III", section: "A", marks: "89%", exams: "Quarterly", status: "Pass" },
    { key: "2", id: "35013", name: "Joann", class: "IV", section: "B", marks: "88%", exams: "Practical", status: "Pass" },
    { key: "3", id: "35010", name: "Gifford", class: "I", section: "B", marks: "21%", exams: "Mid Term", status: "Pass" },
    { key: "4", id: "35009", name: "Lisa", class: "II", section: "B", marks: "31%", exams: "Annual", status: "Fail" }
];

async function insertData() {
    try {
        await client.connect();
        const database = client.db("la-neenos"); // Replace "school" with your DB name
        const collection = database.collection("student-data"); // Replace "students" with your collection name

        const result = await collection.insertMany(students);
        console.log(`${result.insertedCount} documents inserted`);
    } catch (err) {
        console.error("Error inserting data:", err);
    } finally {
        await client.close();
    }
}

insertData();
