async function main() {
  try {
    const res = await fetch('https://drivix-backend-0qvx.onrender.com/api/v1/parking');
    const data = await res.json();
    console.log(`Render API returned ${data.length} locations:`);
    data.forEach((loc, i) => {
      console.log(`[${i+1}] ID: ${loc._id} | Name: ${loc.parkingName} | Status: ${loc.status}`);
    });
  } catch (err) {
    console.error('Error fetching Render API:', err.message);
  }
}

main();
