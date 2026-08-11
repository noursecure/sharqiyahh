
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

async function main() {
    try {
        const product = {
            name: "Test Stock Color",
            nameAr: "تجربة",
            price: 50,
            image: "/src/assets/product-1.jpg",
            category: "Basics",
            description: "Test description",
            descriptionAr: "وصف تجريبي",
            stock: 100,
            colors: "Red,Green,Blue"
        };

        console.log("Creating product with stock and colors...");
        const response = await axios.post(`${API_URL}/products`, product);
        console.log("Product created:", response.data);

        if (response.data.stock === 100 && response.data.colors === "Red,Green,Blue") {
            console.log("SUCCESS: Stock and Colors saved correctly.");
        } else {
            console.error("FAILURE: Stock or Colors missing/incorrect.", response.data);
        }
    } catch (error) {
        console.error("Error creating product:", error);
    }
}

main();
