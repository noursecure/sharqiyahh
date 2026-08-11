
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

async function checkProducts() {
    console.log("Checking Products API...");
    try {
        const res = await axios.get(`${API_URL}/products`);
        console.log(`Status: ${res.status}`);
        if (Array.isArray(res.data)) {
            console.log(`Count: ${res.data.length}`);
            if (res.data.length > 0) {
                console.log("Sample:", res.data[0]);
            }
        } else {
            console.log("Data is not an array:", res.data);
        }
    } catch (error) {
        console.error("Error fetching products:", error);
    }
}

checkProducts();
